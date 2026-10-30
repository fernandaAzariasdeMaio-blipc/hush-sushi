# HUSH Sushi Bar — Landing page

Landing page de sushi bar com identidade japonesa: fundo escuro (sumi) e creme (washi), vermelho do sol
e do carimbo hanko, ondas seigaiha, kanjis decorativos e fotos recortadas que "vazam" das seções.

Abra `index.html` no navegador: funciona sem build.

## Arquivos

```
index.html            → estrutura da página
assets/css/style.css  → todo o estilo, com tokens em :root
assets/js/script.js   → links de WhatsApp + formulário de reserva
assets/img/           → fotos (.jpg + versões .webp) e recortes .webp transparentes
```

## Configurar

- **WhatsApp:** preencha `WHATSAPP_NUMERO` em `assets/js/script.js` (só dígitos, ex.: `5511999998888`).
  Todo link com `data-wa="mensagem"` passa a abrir o WhatsApp com a mensagem pronta (botões do hero,
  "Pedir →" dos pratos, Combinados, Como pedir e o botão verde flutuante). O formulário envia a reserva
  pelo WhatsApp. Sem número, os links levam ao formulário de contato.
- **Dados fictícios (portfólio):** endereço, horário, telefone, preços, nota no Google etc. são inventados.
  Com `WHATSAPP_NUMERO` vazio, o formulário só mostra uma confirmação de demonstração.

## Design tokens

| Token | Valor | Uso |
|---|---|---|
| `--shu` | `#D9301A` | botões, sol, carimbos (texto branco passa AA) |
| `--shu-deep` | `#B8240F` | fundo dos Combinados, texto vermelho sobre creme |
| `--sumi` / `--sumi-2` / `--sumi-3` | `#0F0E0D` / `#1A1816` / `#0A0909` | seções escuras / cards escuros / topbar e rodapé |
| `--washi` | `#F5EEE3` | fundo claro (cards claros em `#FFFFFF`) |
| `--gold` | `#C9A15B` | rótulos e detalhes sobre escuro, borda do botão secundário |
| `--muted` / `--muted-dark` | `#5C554C` / `#BDB5A8` | texto secundário (claro / escuro) |
| `--line` / `--line-dark` | `#D9CFBF` / `#2E2925` | linhas |

**Fontes:** Shippori Mincho B1 (títulos), Yuji Syuku (kanjis decorativos), Zen Kaku Gothic New (texto).
**Raios:** 6px em botões, 12px em cards.

## Seções

Topbar → Hero (HUSH + pincelada vermelha + uramaki) → Categorias (painel sobre o hero) → Os mais pedidos
(carrinho simples) → Faixa de info → A casa → Combinados → Do seu jeito → Contato → Rodapé → WhatsApp flutuante.

## Sushi que cai com o scroll (não quebrar)

- O `<img id="sushi-fly">` fica dentro de `#sushi-anchor`, que não se move; só o `<img>` recebe `transform`.
- O ponto de pouso é `#sushi-landing` (div vazia de 150x120 no cabeçalho de "Os mais pedidos").
- A distância é medida a cada scroll/resize com `getBoundingClientRect`, então funciona em qualquer tela.
- Camadas: o `.hero` é `position: relative` **sem** `z-index` (senão o fundo dele cobriria o painel de
  categorias, que sobe 110px). Ordem: pincelada (0) < painel (2) < sushi (6).
- Nada de `overflow: hidden` no hero nem nos pais do sushi; só `.hero__paint` corta a pincelada.
- Com `prefers-reduced-motion`, o sushi fica parado.
- Foto provisória: o card "Roll de salmão com tarê" usa a foto do uramaki até chegar a foto da peça no hashi
  (procure `TROCAR` no `index.html`).

## Carrinho

- O "+" de cada prato em "Os mais pedidos" adiciona ao carrinho. A barra preta embaixo da tela (ou o
  "Pedir agora" do menu) abre o painel do pedido.
- No painel: mudar quantidades, escolher entrega (taxa `TAXA_ENTREGA` em `script.js`) ou retirada, nome,
  endereço, pagamento e observações. "Enviar pedido pelo WhatsApp" monta a mensagem completa.
- Sem `WHATSAPP_NUMERO`, o painel só mostra a mensagem que seria enviada (modo portfólio).
- O carrinho fica salvo no navegador (`localStorage`), então sobrevive a um F5.
