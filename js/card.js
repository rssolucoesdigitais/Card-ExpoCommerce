/* ============================================================
   Gerador do card "Cheguei" — desenhado 100% em <canvas>, então a
   prévia na tela É o PNG baixado (sem html2canvas, sem diferença
   entre o que a pessoa vê e o arquivo final).
   ============================================================ */
(function () {
  'use strict';

  var W = 1080;
  var FORMATOS = { stories: 1920, feed: 1350 };
  var CORES = {
    ciano:   { a: '#2BE0FF', b: '#3D5CFF' },
    laranja: { a: '#F4A035', b: '#FF6A3D' },
    verde:   { a: '#3DFFB0', b: '#2BE0FF' }
  };
  var NAVY = '#050B24';

  var OK = '#3DFFB0';
  var F_DISPLAY = '"Space Grotesk", "Inter Tight", system-ui, sans-serif';
  var F_BODY = '"Inter Tight", system-ui, sans-serif';
  var F_MONO = '"IBM Plex Mono", ui-monospace, monospace';

  // Posições de cada formato. Stories deixa ~250px livres em cima e
  // embaixo, onde o Instagram sobrepõe a barra de perfil e a de resposta.
  var LAYOUTS = {
    stories: {
      logosY: 290, logoH: 104,
      tituloY: 560, tituloF: 196,
      kickerY: 640, kickerF: 30,
      fotoY: 1000, fotoR: 250,
      nomeY: 1392, nomeF: 80,
      empresaY: 1452, empresaF: 38,
      pillsY: 1530, pillsF: 30, pillsH: 74,
      rodapeY: 1700, rodapeF: 24
    },
    feed: {
      logosY: 118, logoH: 86,
      tituloY: 318, tituloF: 150,
      kickerY: 380, kickerF: 26,
      fotoY: 640, fotoR: 186,
      nomeY: 930, nomeF: 66,
      empresaY: 982, empresaF: 32,
      pillsY: 1040, pillsF: 27, pillsH: 64,
      rodapeY: 1240, rodapeF: 21
    }
  };

  var estado = {
    formato: 'stories',
    cor: 'ciano',
    foto: null,
    zoom: 1,
    offX: 0, // deslocamento da foto em unidades do raio (independe do formato)
    offY: 0,
    nome: '',
    empresa: ''
  };

  var canvas = document.getElementById('card');
  var ctx = canvas.getContext('2d');
  var inputFoto = document.getElementById('inputFoto');
  var zonaFoto = document.getElementById('zonaFoto');
  var zonaFotoTexto = document.getElementById('zonaFotoTexto');
  var blocoZoom = document.getElementById('blocoZoom');
  var zoomEl = document.getElementById('zoom');
  var nomeEl = document.getElementById('nome');
  var empresaEl = document.getElementById('empresa');
  var btnBaixar = document.getElementById('btnBaixar');
  var btnCompartilhar = document.getElementById('btnCompartilhar');
  var aviso = document.getElementById('aviso');
  var dicaArraste = document.getElementById('dicaArraste');

  // ---------- logos ----------
  var logoExpo = carregarImg('img/logo-expo-commerce-branco.png');
  var logoRs = carregarImg('img/logo-rs-light.png');
  // o PNG da RS tem muita margem transparente — recorta só a marca
  var RS_RECORTE = { x: 70, y: 92, w: 612, h: 250 };

  function carregarImg(src) {
    var img = new Image();
    img.onload = desenhar;
    img.src = src;
    return img;
  }
  function pronta(img) { return img && img.complete && img.naturalWidth > 0; }

  // ---------- fundo determinístico (mesmas estrelas em toda renderização) ----------
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function desenharFundo(H, cor) {
    var g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 1.1);
    g.addColorStop(0, '#0C1640');
    g.addColorStop(1, NAVY);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    brilho(W * 0.92, H * 0.1, 640, cor.a, 0.30);
    brilho(W * 0.05, H * 0.88, 760, cor.b, 0.38);

    var r = prng(2026);
    // estrelas
    for (var i = 0; i < 170; i++) {
      var x = r() * W, y = r() * H, s = r() < 0.15 ? 2.4 : 1.4;
      ctx.globalAlpha = 0.25 + r() * 0.55;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    }
    // grafo de nós (mesma linguagem visual do site do evento)
    var nos = [];
    for (var n = 0; n < 26; n++) nos.push({ x: r() * W, y: r() * H });
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = cor.a;
    for (var p = 0; p < nos.length; p++) {
      for (var q = p + 1; q < nos.length; q++) {
        var d = Math.hypot(nos[p].x - nos[q].x, nos[p].y - nos[q].y);
        if (d < 300) {
          ctx.globalAlpha = 0.16 * (1 - d / 300);
          ctx.beginPath(); ctx.moveTo(nos[p].x, nos[p].y); ctx.lineTo(nos[q].x, nos[q].y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = cor.a;
    nos.forEach(function (no) {
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(no.x, no.y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // moldura interna fina
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 2;
    retArredondado(36, 36, W - 72, H - 72, 36);
    ctx.stroke();
  }

  function brilho(x, y, raio, cor, alfa) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, hexA(cor, alfa));
    g.addColorStop(1, hexA(cor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function retArredondado(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function espacamento(px) {
    if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px';
  }

  // ---------- blocos do card ----------
  function desenharLogos(L) {
    var hExpo = L.logoH;
    var wExpo = pronta(logoExpo) ? hExpo * logoExpo.naturalWidth / logoExpo.naturalHeight : 0;
    var hRs = L.logoH * 1.02;
    var wRs = hRs * RS_RECORTE.w / RS_RECORTE.h;
    var gap = L.logoH * 0.5;
    var total = wExpo + gap * 2 + wRs;
    var x = (W - total) / 2;
    var y = L.logosY - hExpo / 2;

    if (pronta(logoExpo)) ctx.drawImage(logoExpo, x, y, wExpo, hExpo);
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillRect(x + wExpo + gap - 1, L.logosY - hExpo * 0.38, 2, hExpo * 0.76);
    if (pronta(logoRs)) {
      ctx.drawImage(logoRs, RS_RECORTE.x, RS_RECORTE.y, RS_RECORTE.w, RS_RECORTE.h,
        x + wExpo + gap * 2, L.logosY - hRs / 2, wRs, hRs);
    }
  }

  function desenharTitulo(L, cor, brilhoExtra) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    var titulo = 'CHEGUEI!';
    var t = L.tituloF;
    do {
      ctx.font = '700 ' + t + 'px ' + F_DISPLAY;
      espacamento(-t * 0.03);
      t -= 4;
    } while (ctx.measureText(titulo).width > W - 150 && t > 60);
    var g = ctx.createLinearGradient(0, L.tituloY - L.tituloF * 0.8, 0, L.tituloY);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(1, cor.a);
    ctx.fillStyle = g;
    ctx.shadowColor = hexA(cor.a, 0.45);
    ctx.shadowBlur = 40 + (brilhoExtra || 0);
    ctx.fillText(titulo, W / 2, L.tituloY);
    ctx.shadowBlur = 0;
    espacamento(0);
  }

  function desenharKicker(L) {
    ctx.textAlign = 'center';
    ctx.font = '500 ' + L.kickerF + 'px ' + F_MONO;
    espacamento(L.kickerF * 0.18);
    ctx.fillStyle = '#A9B4D6';
    ctx.fillText('NO EXPOCOMMERCE UBERABA', W / 2, L.kickerY);
    espacamento(0);
  }

  // órbita externa com nós (giro em radianos — só muda no vídeo)
  function desenharOrbita(L, cor, giro) {
    var cx = W / 2, cy = L.fotoY, r = L.fotoR;
    ctx.strokeStyle = hexA(cor.a, 0.22);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 14]);
    ctx.beginPath(); ctx.arc(cx, cy, r + 46, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cor.a;
    [-2.4, -0.55, 2.1].forEach(function (ang) {
      ang += giro;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * (r + 46), cy + Math.sin(ang) * (r + 46), 7, 0, Math.PI * 2); ctx.fill();
    });
  }

  // anel com gradiente; prog < 1 desenha só um arco (o anel "se fechando")
  function desenharAnel(L, cor, prog) {
    var cx = W / 2, cy = L.fotoY, r = L.fotoR;
    var g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, cor.a);
    g.addColorStop(1, cor.b);
    ctx.strokeStyle = g;
    ctx.lineWidth = 12;
    ctx.lineCap = prog < 1 ? 'round' : 'butt';
    ctx.shadowColor = hexA(cor.a, 0.55);
    ctx.shadowBlur = 50;
    ctx.beginPath(); ctx.arc(cx, cy, r + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
  }

  function desenharFoto(L, cor, escala) {
    var cx = W / 2, cy = L.fotoY, r = L.fotoR;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (estado.foto) {
      var f = estado.foto;
      var base = (2 * r) / Math.min(f.naturalWidth, f.naturalHeight);
      var w = f.naturalWidth * base * estado.zoom * escala;
      var h = f.naturalHeight * base * estado.zoom * escala;
      ctx.drawImage(f, cx - w / 2 + estado.offX * r * escala, cy - h / 2 + estado.offY * r * escala, w, h);
    } else {
      ctx.fillStyle = 'rgba(18,32,85,.85)';
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.fillStyle = hexA(cor.a, 0.9);
      desenharIconeCamera(cx, cy - r * 0.12, r * 0.34);
      ctx.font = '600 ' + Math.round(r * 0.13) + 'px ' + F_BODY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#A9B4D6';
      ctx.fillText('Toque pra adicionar sua foto', cx, cy + r * 0.38);
    }
    ctx.restore();
  }

  function centroSelo(L) {
    return { x: W / 2 + L.fotoR * 0.72, y: L.fotoY + L.fotoR * 0.72, r: L.fotoR * 0.19 };
  }

  function desenharSelo(L) {
    var s = centroSelo(L), sx = s.x, sy = s.y, sr = s.r;
    ctx.fillStyle = NAVY;
    ctx.beginPath(); ctx.arc(sx, sy, sr + 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = OK;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = sr * 0.2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(sx - sr * 0.42, sy + sr * 0.02);
    ctx.lineTo(sx - sr * 0.1, sy + sr * 0.34);
    ctx.lineTo(sx + sr * 0.46, sy - sr * 0.3);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function desenharIconeCamera(cx, cy, s) {
    retArredondado(cx - s, cy - s * 0.62, s * 2, s * 1.4, s * 0.22);
    ctx.fill();
    ctx.fillRect(cx - s * 0.42, cy - s * 0.85, s * 0.84, s * 0.3);
    ctx.fillStyle = 'rgba(18,32,85,1)';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.06, s * 0.42, 0, Math.PI * 2); ctx.fill();
  }

  function desenharNome(L) {
    ctx.textAlign = 'center';
    var nome = estado.nome.trim() || 'Seu nome aqui';
    ctx.fillStyle = estado.nome.trim() ? '#F5F7FF' : 'rgba(245,247,255,.35)';
    ajustarTexto(nome, '700', L.nomeF, F_DISPLAY, W - 160, L.nomeY);
  }

  function desenharEmpresa(L, cor) {
    if (!estado.empresa.trim()) return;
    ctx.textAlign = 'center';
    ctx.fillStyle = cor.a;
    ajustarTexto(estado.empresa.trim(), '500', L.empresaF, F_BODY, W - 200, L.empresaY);
  }

  // pílulas de data e local — devolve a caixa de cada uma pra animação
  function caixasPills(L) {
    var pills = ['26 de setembro de 2026', 'CDL Hall · Uberaba, MG'];
    ctx.font = '600 ' + L.pillsF + 'px ' + F_BODY;
    var pad = L.pillsH * 0.55, gap = 18, ponto = L.pillsF * 0.5;
    var larguras = pills.map(function (t) { return ctx.measureText(t).width + pad * 2 + ponto + 12; });
    var y0 = L.pillsY + (estado.empresa.trim() ? 0 : -L.empresaF * 0.6);
    var total = larguras[0] + gap + larguras[1];
    var linhas = total > W - 140 ? [[0], [1]] : [[0, 1]];
    var caixas = [];
    linhas.forEach(function (linha, li) {
      var soma = linha.reduce(function (s, i) { return s + larguras[i]; }, 0) + gap * (linha.length - 1);
      var x = (W - soma) / 2;
      var y = y0 + li * (L.pillsH + 14);
      linha.forEach(function (i) {
        caixas[i] = { texto: pills[i], x: x, y: y, w: larguras[i], h: L.pillsH, pad: pad, ponto: ponto };
        x += larguras[i] + gap;
      });
    });
    return caixas;
  }

  function desenharPill(c, L, cor) {
    ctx.font = '600 ' + L.pillsF + 'px ' + F_BODY;
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 2;
    retArredondado(c.x, c.y, c.w, c.h, c.h / 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = cor.a;
    ctx.beginPath(); ctx.arc(c.x + c.pad + c.ponto / 2, c.y + c.h / 2, c.ponto / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F5F7FF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.texto, c.x + c.pad + c.ponto + 12, c.y + c.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
  }

  function desenharRodape(L) {
    ctx.textAlign = 'center';
    ctx.font = '500 ' + L.rodapeF + 'px ' + F_MONO;
    espacamento(L.rodapeF * 0.16);
    ctx.fillStyle = 'rgba(169,180,214,.75)';
    ctx.fillText('#EXPOCOMMERCEUBERABA · 1ª EDIÇÃO', W / 2, L.rodapeY);
    espacamento(0);
  }

  // reduz a fonte até caber; se nem no mínimo couber, corta com reticências
  function ajustarTexto(texto, peso, tamanho, familia, maxW, y) {
    var t = tamanho, min = Math.round(tamanho * 0.6);
    ctx.font = peso + ' ' + t + 'px ' + familia;
    while (ctx.measureText(texto).width > maxW && t > min) {
      t -= 2;
      ctx.font = peso + ' ' + t + 'px ' + familia;
    }
    if (ctx.measureText(texto).width > maxW) {
      while (texto.length > 1 && ctx.measureText(texto + '…').width > maxW) texto = texto.slice(0, -1);
      texto = texto.trim() + '…';
    }
    ctx.fillText(texto, W / 2, y);
  }

  // ---------- fundo em cache (muda só com formato/cor) ----------
  var cacheFundo = { chave: '', canvas: document.createElement('canvas') };
  function fundoPronto(H, cor) {
    var chave = estado.formato + '|' + estado.cor;
    if (cacheFundo.chave !== chave) {
      cacheFundo.canvas.width = W;
      cacheFundo.canvas.height = H;
      var principal = ctx;
      ctx = cacheFundo.canvas.getContext('2d');
      desenharFundo(H, cor);
      ctx = principal;
      cacheFundo.chave = chave;
    }
    return cacheFundo.canvas;
  }

  // ============================================================
  //  CENA — t = null desenha o card final (imagem); t em segundos
  //  desenha o quadro t do vídeo: viagem pelas estrelas → chegada
  //  → elementos do card entrando um a um.
  // ============================================================
  var DURACAO = 8.5;
  var FPS = 30;

  function limitar(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function faixa(t, a, b) { return t === null ? 1 : limitar((t - a) / (b - a)); }
  function saidaCubica(p) { return 1 - Math.pow(1 - p, 3); }
  function saidaBack(p) { var c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function suave(p) { return p * p * (3 - 2 * p); }

  // aplica entrada (opacidade + deslocamento + escala em torno de ox,oy)
  // (a onda de choque da chegada também empurra o elemento quando passa por ele)
  function entrada(p, ox, oy, dy, escalaIni, fn, curva) {
    if (p <= 0) return;
    var emp = empurraoOnda(ox, oy);
    if (emp) { ctx.save(); ctx.translate(emp.x, emp.y); }
    if (p >= 1) {
      fn();
    } else {
      var e = (curva || saidaCubica)(p);
      var s = escalaIni + (1 - escalaIni) * e;
      ctx.save();
      ctx.globalAlpha = limitar(p * 1.6);
      ctx.translate(ox, oy + dy * (1 - e));
      ctx.scale(s, s);
      ctx.translate(-ox, -oy);
      fn();
      ctx.restore();
    }
    if (emp) ctx.restore();
  }

  // ---------- onda de choque da chegada ----------
  // Sai do ponto de fuga da viagem no clarão, varre a tela até passar das
  // bordas; por onde a frente passa, empurra os elementos pra fora e eles
  // voltam amortecendo. O fundo dá uma pulsada e a câmera treme de leve.
  var ONDA_INICIO = 2.9, ONDA_DURACAO = 0.95, ONDA_ALCANCE = 300;
  var tempoCena = null; // t do quadro sendo desenhado (null = card estático)

  function centroOnda(H) { return { x: W / 2, y: H * 0.46 }; }
  function raioOnda(t, H) {
    var p = limitar((t - ONDA_INICIO) / ONDA_DURACAO);
    var c = centroOnda(H);
    var max = Math.hypot(W / 2, Math.max(c.y, H - c.y)) * 1.15;
    return { p: p, r: max * saidaCubica(p) };
  }
  // deslocamento que a frente aplica num ponto: 0 quando chega, pico, e volta
  // a 0 quando a frente já está ONDA_ALCANCE px adiante
  function empurraoOnda(x, y) {
    var t = tempoCena;
    if (t === null || t <= ONDA_INICIO) return null;
    var H = canvas.height, c = centroOnda(H), o = raioOnda(t, H);
    var dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy) || 1;
    var k = (o.r - d) / ONDA_ALCANCE;
    if (k <= 0 || k >= 1) return null;
    var m = 32 * (1 - 0.5 * o.p) * Math.sin(k * Math.PI) * Math.exp(-k * 1.5);
    return { x: dx / d * m, y: dy / d * m };
  }

  function desenharOnda(t, H, cor) {
    var c = centroOnda(H);
    // anel principal + um eco mais fino logo atrás
    [[0, 1], [0.13, 0.55]].forEach(function (cfg) {
      var o = raioOnda(t - cfg[0], H);
      if (o.p <= 0 || o.p >= 1) return;
      var alfa = cfg[1] * Math.pow(1 - o.p, 1.3);
      var larg = (80 - 60 * o.p) * cfg[1];
      var ext = o.r + larg * 0.5;
      var g = ctx.createRadialGradient(c.x, c.y, Math.max(0, o.r - larg * 1.8), c.x, c.y, ext);
      g.addColorStop(0, hexA(cor.b, 0));
      g.addColorStop(0.62, hexA(cor.b, alfa * 0.35));
      g.addColorStop(0.84, hexA(cor.a, alfa * 0.8));
      g.addColorStop(0.93, 'rgba(255,255,255,' + (alfa * 0.95).toFixed(3) + ')');
      g.addColorStop(1, hexA(cor.a, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c.x, c.y, ext, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  function tremor(t) {
    var dt = t - 2.95;
    if (dt < 0 || dt > 0.7) return null;
    var a = 16 * Math.exp(-dt * 7);
    return { x: a * Math.sin(dt * 71), y: a * 0.6 * Math.cos(dt * 53) };
  }

  // velocidade da "nave" (profundidade por segundo) — acelera, cruza, freia
  function velocidade(t) {
    if (t < 0.3) return 0.12;
    if (t < 1.4) { var a = (t - 0.3) / 1.1; return 0.12 + 2.3 * a * a; }
    if (t < 2.2) return 2.42;
    if (t < 3.1) return 0.05 + 2.37 * Math.pow(1 - (t - 2.2) / 0.9, 3);
    return 0.05;
  }
  // distância percorrida até t (integrada uma vez, em passos de 1/240 s)
  var PERCURSO = (function () {
    var passo = 1 / 240, arr = [0];
    for (var i = 1; i * passo <= DURACAO + 1; i++) arr.push(arr[i - 1] + velocidade(i * passo) * passo);
    return arr;
  })();
  function percurso(t) { return PERCURSO[Math.min(PERCURSO.length - 1, Math.round(t * 240))]; }

  var ESTRELAS = (function () {
    var r = prng(777), lista = [];
    for (var i = 0; i < 750; i++) {
      lista.push({ x: (r() * 2 - 1) * 1.6, y: (r() * 2 - 1) * 1.6, z: r(), cor: r() < 0.22, tam: 0.6 + r() * 1.4 });
    }
    return lista;
  })();

  function desenharViagem(t, H, cor, alfa) {
    var v = velocidade(t), s = percurso(t);
    var cx = W / 2, cy = H * 0.46, f = W * 0.42;
    var rasto = Math.min(0.35, v * 0.075);
    ctx.lineCap = 'round';
    for (var i = 0; i < ESTRELAS.length; i++) {
      var e = ESTRELAS[i];
      var z = ((e.z - s) % 1 + 1) % 1 + 0.02;
      var z2 = z + rasto;
      var x1 = cx + e.x / z * f, y1 = cy + e.y * (H / W) / z * f;
      if (x1 < -50 || x1 > W + 50 || y1 < -50 || y1 > H + 50) continue;
      var x2 = cx + e.x / z2 * f, y2 = cy + e.y * (H / W) / z2 * f;
      var perto = 1 - z;
      ctx.globalAlpha = alfa * limitar(perto * 1.8);
      ctx.strokeStyle = e.cor ? cor.a : '#FFFFFF';
      ctx.lineWidth = e.tam * (0.8 + perto * 3.2);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x1 + 0.01, y1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  function desenharCena(t) {
    var H = FORMATOS[estado.formato];
    if (canvas.height !== H) canvas.height = H;
    var L = LAYOUTS[estado.formato];
    var cor = CORES[estado.cor];
    var video = t !== null;
    tempoCena = t;

    ctx.globalAlpha = 1;
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);

    var trem = video ? tremor(t) : null;
    ctx.save();
    if (trem) ctx.translate(trem.x, trem.y);

    if (video) {
      // brilho no ponto de fuga, mais forte quanto mais rápido
      var v = velocidade(t);
      brilho(W / 2, H * 0.46, W * 0.9, cor.b, 0.10 + 0.22 * limitar(v / 2.4));
      brilho(W / 2, H * 0.46, W * 0.35, cor.a, 0.08 + 0.25 * limitar(v / 2.4));
    }

    // fundo do card aparece quando a nave freia
    var pFundo = suave(faixa(t, 2.5, 3.4));
    if (pFundo > 0) {
      ctx.globalAlpha = pFundo;
      // pulsada do fundo quando a onda sai
      var pulsada = video ? 0.045 * Math.exp(-Math.pow((t - 3.02) / 0.14, 2)) : 0;
      if (pulsada > 0.0005) {
        var co = centroOnda(H);
        ctx.save();
        ctx.translate(co.x, co.y); ctx.scale(1 + pulsada, 1 + pulsada); ctx.translate(-co.x, -co.y);
        ctx.drawImage(fundoPronto(H, cor), 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(fundoPronto(H, cor), 0, 0);
      }
      ctx.globalAlpha = 1;
    }

    if (video) {
      // depois da chegada as estrelas seguem passando devagar, mais apagadas
      desenharViagem(t, H, cor, 1 - 0.55 * pFundo);
      // clarão da chegada
      // (curto e fraco: quem marca o impacto é a onda de choque)
      var clarao = 0.24 * Math.exp(-Math.pow((t - 2.92) / 0.1, 2));
      if (clarao > 0.01) {
        ctx.globalAlpha = clarao;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-40, -40, W + 80, H + 80); // folga pro tremor não mostrar a borda
        ctx.globalAlpha = 1;
      }
    }

    entrada(faixa(t, 3.0, 3.6), W / 2, L.logosY, -50, 0.92, function () { desenharLogos(L); });

    // título chega grande e "pousa"; pulsa de leve depois
    var pulso = video && t > 4 ? 18 * (0.5 + 0.5 * Math.sin((t - 4) * 3)) : 0;
    entrada(faixa(t, 3.2, 3.9), W / 2, L.tituloY - L.tituloF * 0.35, 0, 1.9,
      function () { desenharTitulo(L, cor, pulso); });
    entrada(faixa(t, 3.6, 4.1), W / 2, L.kickerY, 24, 1, function () { desenharKicker(L); });

    var giro = video ? Math.max(0, t - 4.3) * 0.35 : 0;
    entrada(faixa(t, 4.3, 4.9), W / 2, L.fotoY, 0, 0.85, function () { desenharOrbita(L, cor, giro); });
    var pAnel = faixa(t, 3.8, 4.6);
    if (pAnel > 0) desenharAnel(L, cor, saidaCubica(pAnel));
    var pFoto = faixa(t, 4.0, 4.7);
    entrada(pFoto, W / 2, L.fotoY, 0, 1, function () {
      desenharFoto(L, cor, 1.35 - 0.35 * saidaCubica(pFoto));
    });
    var selo = centroSelo(L);
    entrada(faixa(t, 4.6, 5.0), selo.x, selo.y, 0, 0, function () { desenharSelo(L); }, saidaBack);

    entrada(faixa(t, 4.8, 5.35), W / 2, L.nomeY, 40, 1, function () { desenharNome(L); });
    entrada(faixa(t, 5.0, 5.5), W / 2, L.empresaY, 30, 1, function () { desenharEmpresa(L, cor); });
    caixasPills(L).forEach(function (c, i) {
      entrada(faixa(t, 5.2 + i * 0.15, 5.75 + i * 0.15), c.x + c.w / 2, c.y + c.h / 2, 30, 0.9,
        function () { desenharPill(c, L, cor); });
    });
    entrada(faixa(t, 5.7, 6.2), W / 2, L.rodapeY, 16, 1, function () { desenharRodape(L); });

    if (video) desenharOnda(t, H, cor);
    ctx.restore(); // tremor
    tempoCena = null;
  }

  function desenhar() {
    // qualquer mudança no card deixa o vídeo já gerado desatualizado
    if (videoPronto) descartarVideo();
    if (animando) return; // a prévia/gravação redesenha sozinha a cada quadro
    desenharCena(null);
  }

  // ---------- foto ----------
  function abrirFoto(arquivo) {
    if (!arquivo || !/^image\//.test(arquivo.type)) {
      aviso.textContent = 'Esse arquivo não é uma imagem. Tente um JPG ou PNG.';
      return;
    }
    var url = URL.createObjectURL(arquivo);
    var img = new Image();
    img.onload = function () {
      if (estado.foto && estado.foto._url) URL.revokeObjectURL(estado.foto._url);
      img._url = url;
      estado.foto = img;
      estado.zoom = 1; estado.offX = 0; estado.offY = 0;
      zoomEl.value = 1;
      blocoZoom.hidden = false;
      dicaArraste.hidden = false;
      zonaFotoTexto.innerHTML = 'Trocar foto <small>' + escapar(arquivo.name) + '</small>';
      canvas.classList.add('arrastavel');
      atualizar();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      aviso.textContent = 'Não foi possível abrir essa imagem. Tente outro arquivo (JPG ou PNG).';
    };
    img.src = url;
  }

  function escapar(s) {
    return s.replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; });
  }

  // mantém a foto cobrindo o círculo inteiro (sem bordas vazias)
  function limitarDeslocamento() {
    var f = estado.foto;
    if (!f) return;
    var menor = Math.min(f.naturalWidth, f.naturalHeight);
    var meiaW = f.naturalWidth / menor * estado.zoom; // meia-largura em unidades do raio
    var meiaH = f.naturalHeight / menor * estado.zoom;
    var maxX = Math.max(0, meiaW - 1), maxY = Math.max(0, meiaH - 1);
    estado.offX = Math.min(maxX, Math.max(-maxX, estado.offX));
    estado.offY = Math.min(maxY, Math.max(-maxY, estado.offY));
  }

  inputFoto.addEventListener('change', function () {
    abrirFoto(inputFoto.files[0]);
    inputFoto.value = '';
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    zonaFoto.addEventListener(ev, function (e) { e.preventDefault(); zonaFoto.classList.add('sobre'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    zonaFoto.addEventListener(ev, function () { zonaFoto.classList.remove('sobre'); });
  });
  zonaFoto.addEventListener('drop', function (e) {
    e.preventDefault();
    abrirFoto(e.dataTransfer.files[0]);
  });
  // soltar a foto direto em cima do card também funciona
  canvas.addEventListener('dragover', function (e) { e.preventDefault(); });
  canvas.addEventListener('drop', function (e) { e.preventDefault(); abrirFoto(e.dataTransfer.files[0]); });

  zoomEl.addEventListener('input', function () {
    estado.zoom = parseFloat(zoomEl.value);
    limitarDeslocamento();
    desenhar();
  });
  document.getElementById('btnCentralizar').addEventListener('click', function () {
    estado.zoom = 1; estado.offX = 0; estado.offY = 0;
    zoomEl.value = 1;
    desenhar();
  });

  // ---------- arrastar a foto dentro do card ----------
  function pontoNoCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    var escala = canvas.width / rect.width;
    return { x: (e.clientX - rect.left) * escala, y: (e.clientY - rect.top) * escala, escala: escala };
  }
  function dentroDaFoto(p) {
    var L = LAYOUTS[estado.formato];
    return Math.hypot(p.x - W / 2, p.y - L.fotoY) <= L.fotoR + 50;
  }

  var arraste = null;
  canvas.addEventListener('pointerdown', function (e) {
    if (gravando) return;
    var p = pontoNoCanvas(e);
    if (!estado.foto) {
      if (dentroDaFoto(p)) inputFoto.click();
      return;
    }
    arraste = { x: e.clientX, y: e.clientY, offX: estado.offX, offY: estado.offY, escala: p.escala };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('arrastando');
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!arraste) return;
    var r = LAYOUTS[estado.formato].fotoR;
    estado.offX = arraste.offX + (e.clientX - arraste.x) * arraste.escala / r;
    estado.offY = arraste.offY + (e.clientY - arraste.y) * arraste.escala / r;
    limitarDeslocamento();
    desenhar();
  });
  function soltar() { arraste = null; canvas.classList.remove('arrastando'); }
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  canvas.addEventListener('wheel', function (e) {
    if (!estado.foto) return;
    e.preventDefault();
    estado.zoom = Math.min(3, Math.max(1, estado.zoom - e.deltaY * 0.0015));
    zoomEl.value = estado.zoom;
    limitarDeslocamento();
    desenhar();
  }, { passive: false });

  // ---------- textos, formato, cor ----------
  nomeEl.addEventListener('input', function () { estado.nome = nomeEl.value; atualizar(); });
  empresaEl.addEventListener('input', function () { estado.empresa = empresaEl.value; desenhar(); });

  function grupoRadio(seletor, attr, chave) {
    var botoes = document.querySelectorAll(seletor + ' [role="radio"]');
    botoes.forEach(function (b) {
      b.addEventListener('click', function () {
        botoes.forEach(function (o) { o.setAttribute('aria-checked', String(o === b)); });
        estado[chave] = b.getAttribute(attr);
        desenhar();
      });
    });
  }
  grupoRadio('.segmento', 'data-formato', 'formato');
  grupoRadio('.cores', 'data-cor', 'cor');

  // ---------- baixar / compartilhar ----------
  function atualizar() {
    var ok = !!estado.foto && estado.nome.trim().length > 0;
    btnBaixar.disabled = !ok;
    btnCompartilhar.disabled = !ok;
    btnGerarVideo.disabled = !ok || gravando;
    if (ok) aviso.textContent = 'Tudo pronto! Baixe o card ou gere o vídeo e poste marcando o evento.';
    else if (!estado.foto && !estado.nome.trim()) aviso.textContent = 'Adicione sua foto e seu nome pra liberar o download.';
    else if (!estado.foto) aviso.textContent = 'Falta só a sua foto.';
    else aviso.textContent = 'Falta só o seu nome.';
    desenhar();
  }

  function nomeArquivo(ext) {
    var slug = estado.nome.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'cheguei-expocommerce' + (slug ? '-' + slug : '') + '-' + estado.formato + '.' + (ext || 'png');
  }

  function gerarBlob() {
    desenharCena(null);
    return new Promise(function (ok) { canvas.toBlob(ok, 'image/png'); });
  }

  function baixarArquivo(blob, nome) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  btnBaixar.addEventListener('click', function () {
    gerarBlob().then(function (blob) { baixarArquivo(blob, nomeArquivo('png')); });
  });

  // Web Share com arquivo: celular abre direto o menu (Instagram, WhatsApp…)
  var podeCompartilhar = false;
  try {
    podeCompartilhar = !!(navigator.canShare &&
      navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
  } catch (e) { podeCompartilhar = false; }
  btnCompartilhar.hidden = !podeCompartilhar;

  btnCompartilhar.addEventListener('click', function () {
    gerarBlob().then(function (blob) {
      var arquivo = new File([blob], nomeArquivo(), { type: 'image/png' });
      return navigator.share({
        files: [arquivo],
        text: 'Cheguei no ExpoCommerce Uberaba com a RS Soluções Digitais! 26/09 · CDL Hall #ExpoCommerceUberaba'
      });
    }).catch(function (err) {
      if (err && err.name !== 'AbortError') aviso.textContent = 'Não deu pra compartilhar direto — use "Baixar card".';
    });
  });

  // ============================================================
  //  VÍDEO — prévia em tempo real + gravação em MP4
  //  Caminho principal: WebCodecs (VideoEncoder) + mp4-muxer, que
  //  codifica quadro a quadro com tempo exato (mais rápido que o
  //  tempo real e sem engasgo). Sem suporte → MediaRecorder em
  //  tempo real, que em alguns navegadores só sai em WebM.
  // ============================================================
  var btnPrevia = document.getElementById('btnPrevia');
  var btnGerarVideo = document.getElementById('btnGerarVideo');
  var btnBaixarVideo = document.getElementById('btnBaixarVideo');
  var btnCompartilharVideo = document.getElementById('btnCompartilharVideo');
  var acoesVideo = document.getElementById('acoesVideo');
  var progresso = document.getElementById('progresso');
  var progressoBarra = document.getElementById('progressoBarra');
  var videoAviso = document.getElementById('videoAviso');
  var painel = document.querySelector('.painel');

  var animando = false;
  var gravando = false;
  var videoPronto = null; // { blob, ext }
  var idPrevia = 0;

  function descartarVideo() {
    videoPronto = null;
    acoesVideo.hidden = true;
    videoAviso.textContent = '';
  }

  // no celular o card fica lá em cima — traz ele pra tela antes de animar
  function mostrarCard() {
    var r = canvas.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function tocarPrevia() {
    if (gravando) return;
    mostrarCard();
    var id = ++idPrevia;
    var inicio = performance.now();
    animando = true;
    btnPrevia.textContent = 'Parar animação';
    function quadro(agora) {
      if (id !== idPrevia) return;
      var t = (agora - inicio) / 1000;
      if (t >= DURACAO) { pararPrevia(); return; }
      desenharCena(t);
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }
  function pararPrevia() {
    idPrevia++;
    animando = false;
    btnPrevia.textContent = 'Ver animação';
    desenharCena(null);
  }
  btnPrevia.addEventListener('click', function () {
    if (animando && !gravando) pararPrevia(); else tocarPrevia();
  });

  function mostrarProgresso(p) {
    progresso.hidden = false;
    progressoBarra.style.width = Math.round(p * 100) + '%';
  }

  function escolherCodec(H) {
    var candidatos = ['avc1.640033', 'avc1.640032', 'avc1.640028', 'avc1.4d0033', 'avc1.4d0028', 'avc1.42003e'];
    var i = 0;
    function proximo() {
      if (i >= candidatos.length) return Promise.resolve(null);
      var config = { codec: candidatos[i++], width: W, height: H, bitrate: 12e6, framerate: FPS, avc: { format: 'avc' } };
      return VideoEncoder.isConfigSupported(config).then(function (r) {
        return r.supported ? config : proximo();
      }, proximo);
    }
    return proximo();
  }

  function gravarWebCodecs() {
    var H = FORMATOS[estado.formato];
    return escolherCodec(H).then(function (config) {
      if (!config) throw new Error('sem codec H.264');
      var muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H, frameRate: FPS },
        fastStart: 'in-memory'
      });
      var erro = null;
      var encoder = new VideoEncoder({
        output: function (chunk, meta) { muxer.addVideoChunk(chunk, meta); },
        error: function (e) { erro = e; }
      });
      encoder.configure(config);
      var total = Math.round(DURACAO * FPS);
      var i = 0;

      return new Promise(function (ok, falha) {
        function passo() {
          if (erro) { falha(erro); return; }
          // não deixa a fila do encoder crescer demais (memória no celular)
          if (encoder.encodeQueueSize > 6) { setTimeout(passo, 5); return; }
          var lote = Math.min(total, i + 3);
          for (; i < lote; i++) {
            desenharCena(i / FPS);
            var frame = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
            encoder.encode(frame, { keyFrame: i % FPS === 0 });
            frame.close();
          }
          mostrarProgresso(i / total * 0.95);
          if (i < total) { setTimeout(passo, 0); return; }
          encoder.flush().then(function () {
            if (erro) throw erro;
            encoder.close();
            muxer.finalize();
            ok({ blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), ext: 'mp4' });
          }).catch(falha);
        }
        passo();
      });
    });
  }

  function gravarMediaRecorder() {
    var tipos = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    var tipo = tipos.filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0] || '';
    var stream = canvas.captureStream(FPS);
    var gravador = new MediaRecorder(stream, { mimeType: tipo, videoBitsPerSecond: 12e6 });
    var partes = [];
    gravador.ondataavailable = function (e) { if (e.data.size) partes.push(e.data); };
    return new Promise(function (ok, falha) {
      gravador.onerror = function (e) { falha(e.error || e); };
      gravador.onstop = function () {
        var mime = gravador.mimeType || tipo || 'video/webm';
        ok({ blob: new Blob(partes, { type: mime }), ext: /mp4/.test(mime) ? 'mp4' : 'webm' });
      };
      desenharCena(0);
      gravador.start();
      var inicio = performance.now();
      function quadro(agora) {
        var t = (agora - inicio) / 1000;
        if (t >= DURACAO) { desenharCena(DURACAO); gravador.stop(); return; }
        desenharCena(t);
        mostrarProgresso(t / DURACAO);
        requestAnimationFrame(quadro);
      }
      requestAnimationFrame(quadro);
    });
  }

  btnGerarVideo.addEventListener('click', function () {
    if (gravando) return;
    if (animando) pararPrevia();
    gravando = true;
    animando = true;
    painel.inert = true;
    btnGerarVideo.disabled = true;
    descartarVideo();
    videoAviso.textContent = 'Gerando o vídeo… não feche a página.';
    mostrarCard();
    mostrarProgresso(0);

    var temWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && typeof Mp4Muxer !== 'undefined';
    var gravar = temWebCodecs
      ? gravarWebCodecs().catch(function (e) {
          console.warn('WebCodecs falhou, usando MediaRecorder', e);
          return gravarMediaRecorder();
        })
      : gravarMediaRecorder();

    function encerrar() {
      gravando = false;
      animando = false;
      painel.inert = false;
      setTimeout(function () { progresso.hidden = true; }, 600);
      atualizar(); // redesenha o card estático — antes de publicar o vídeo, senão ele seria descartado
    }

    gravar.then(function (res) {
      mostrarProgresso(1);
      encerrar();
      videoPronto = res;
      acoesVideo.hidden = false;
      btnCompartilharVideo.hidden = !podeCompartilharArquivo(res);
      videoAviso.textContent = res.ext === 'mp4'
        ? 'Vídeo pronto (MP4, ' + DURACAO + 's). Poste nos stories ou reels e escolha uma música no Instagram.'
        : 'Vídeo pronto, mas este navegador só gera WebM — o Instagram pode não aceitar. No Chrome ou Safari atualizados sai em MP4.';
    }).catch(function (e) {
      console.error(e);
      encerrar();
      videoAviso.textContent = 'Não foi possível gerar o vídeo neste navegador. Tente no Chrome ou Safari atualizados.';
    });
  });

  function podeCompartilharArquivo(res) {
    try {
      return !!(navigator.canShare && navigator.canShare({
        files: [new File([res.blob], nomeArquivo(res.ext), { type: res.blob.type })]
      }));
    } catch (e) { return false; }
  }

  btnBaixarVideo.addEventListener('click', function () {
    if (videoPronto) baixarArquivo(videoPronto.blob, nomeArquivo(videoPronto.ext));
  });
  btnCompartilharVideo.addEventListener('click', function () {
    if (!videoPronto) return;
    navigator.share({
      files: [new File([videoPronto.blob], nomeArquivo(videoPronto.ext), { type: videoPronto.blob.type })],
      text: 'Cheguei no ExpoCommerce Uberaba com a RS Soluções Digitais! #ExpoCommerceUberaba'
    }).catch(function (err) {
      if (err && err.name !== 'AbortError') videoAviso.textContent = 'Não deu pra compartilhar direto — use "Baixar vídeo".';
    });
  });

  // ---------- início ----------
  desenhar();
  // redesenha quando as fontes do Google chegarem (canvas não refaz sozinho)
  if (document.fonts) {
    Promise.all([
      document.fonts.load('700 100px "Space Grotesk"'),
      document.fonts.load('600 40px "Inter Tight"'),
      document.fonts.load('500 40px "Inter Tight"'),
      document.fonts.load('500 30px "IBM Plex Mono"')
    ]).then(desenhar, desenhar);
    document.fonts.ready.then(desenhar);
  }
})();
