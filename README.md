# Card "Cheguei" — ExpoCommerce Uberaba × RS Soluções Digitais

Página estática para a pessoa montar um card **"Cheguei no ExpoCommerce"** com a própria foto e postar nas redes.

- **Abertura:** mesma splash do site do evento ([PG]ExpoCommerce): 3,5 s na primeira visita da aba e 0,9 s ao recarregar
- Foto: escolher, arrastar o arquivo ou tocar no círculo do card; arrastar a foto para enquadrar e usar o zoom (slider ou roda do mouse)
- Nome (obrigatório) e empresa ou cargo (opcional). Nomes longos diminuem de tamanho para caber
- Formatos: **Stories 1080×1920** (deixa livres as áreas que o Instagram cobre) e **Feed 1080×1350**
- Cor de destaque: ciano (evento), laranja (RS) ou verde
- **Baixar card** gera um PNG. **Compartilhar** abre o menu nativo do celular (Instagram, WhatsApp…) quando o navegador tem suporte
- **Vídeo pro Instagram (8,5 s, sem som):** começa com uma viagem pelas estrelas; na chegada, uma onda de choque de luz varre a tela e empurra os elementos e termina com os elementos do card entrando um a um. **Ver animação** mostra a prévia no card. **Gerar vídeo** cria um MP4 no formato escolhido, que pode ser baixado ou compartilhado

O card é desenhado direto em `<canvas>` ([js/card.js](js/card.js)), então a prévia na tela é o mesmo arquivo que é baixado. Não depende de html2canvas.

O vídeo usa o mesmo desenho: `desenharCena(t)` monta o quadro no segundo `t` (`null` = card final). A codificação usa WebCodecs (`VideoEncoder`) com [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) via jsDelivr e gera um MP4 H.264, quadro a quadro, mais rápido que o tempo real. Sem WebCodecs, a página grava em tempo real com MediaRecorder (MP4 quando o navegador tem suporte; se não tiver, WebM). A linha do tempo de cada elemento fica nas chamadas a `faixa(t, início, fim)` dentro de `desenharCena`.

A foto nunca sai do navegador: não há backend.

## Rodar localmente
Qualquer servidor estático serve, por exemplo:

```
npx serve .
```

Para publicar, suba a pasta inteira (GitHub Pages, Vercel, Netlify…).

## Estrutura
- `index.html`: página e controles
- `css/style.css`: mesma paleta e fontes do formulário e do site do evento
- `js/splash.js`: tempo da abertura. O CSS da splash é uma cópia do site do evento (fim do `style.css`); se mudar lá, espelhe aqui
- `js/card.js`: desenho do card, foto, download e compartilhamento. As posições de cada formato ficam em `LAYOUTS`
- `img/`: logos (copiados de `[Site]FormularioExpoCommerce/img`)
