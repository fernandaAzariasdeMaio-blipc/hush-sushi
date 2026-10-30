// Número do WhatsApp do restaurante, só dígitos com DDI e DDD (ex.: '5511999998888').
// Enquanto estiver vazio, os botões de WhatsApp levam ao formulário de contato.
const WHATSAPP_NUMERO = '5548988739017'; // número de teste (deixe '' para voltar ao modo demonstração)

const linkWhats = (msg) => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;

// ---------- Links de WhatsApp (data-wa = mensagem pronta) ----------
if (WHATSAPP_NUMERO) {
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = linkWhats(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

// ---------- Menu sanduíche (celular) ----------
(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('nav-toggle');
  if (!nav || !toggle) return;
  const definir = (aberto) => {
    nav.classList.toggle('is-open', aberto);
    toggle.setAttribute('aria-expanded', String(aberto));
    toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  };
  toggle.addEventListener('click', () => definir(!nav.classList.contains('is-open')));
  // Fecha ao escolher um link ou apertar Esc
  nav.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', () => definir(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { definir(false); toggle.focus(); }
  });
})();

// ---------- Sushi do hero cai até "Os mais pedidos" conforme o scroll ----------
// A âncora fica parada no hero; só o <img> recebe transform. dx/dy são medidos a cada
// quadro, então o efeito acompanha qualquer layout (celular, resize, fontes carregando).
(() => {
  const hero = document.getElementById('hero');
  const ancora = document.getElementById('sushi-anchor');
  const pouso = document.getElementById('sushi-landing');
  const img = document.getElementById('sushi-fly');
  if (!hero || !ancora || !pouso || !img) return;

  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const centro = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  let agendado = false;

  function atualizar() {
    agendado = false;
    const hr = hero.getBoundingClientRect();
    const p = reduzir.matches ? 0 : clamp(-hr.top / (hr.height * 0.75), 0, 1);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    const a = centro(ancora.getBoundingClientRect());
    const l = centro(pouso.getBoundingClientRect());
    const dx = l.x - a.x;
    const dy = l.y - a.y;
    img.style.transform = `translate(${dx * e}px, ${dy * e}px) rotate(${-10 + 370 * e}deg) scale(${1 - 0.6 * e})`;
  }

  function agendar() {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
  }

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar, { passive: true });
  window.addEventListener('load', agendar); // fontes e imagens mudam o layout
  reduzir.addEventListener('change', agendar);
  atualizar();
})();

// ---------- Carrinho: "+" do cardápio → revisar no painel → enviar pelo WhatsApp ----------
(() => {
  const TAXA_ENTREGA = 7.9;
  const CHAVE = 'hush-carrinho'; // guarda o carrinho no navegador (sobrevive a um F5)

  const $ = (id) => document.getElementById(id);
  const dialogo = $('cart');
  const lista = $('cart-list');
  const formCarrinho = $('cart-form');
  const badge = $('cart-badge');
  const aviso = $('cart-status');
  const barra = $('cart-bar');

  const real = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const lerPreco = (txt) => Number(txt.replace(/[^\d,]/g, '').replace(',', '.')) || 0; // "R$ 42,90" → 42.9
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Pratos do cardápio, lidos dos próprios cards (nome, preço e foto)
  const pratos = {};
  document.querySelectorAll('.item').forEach((card) => {
    const nome = card.querySelector('h3').textContent.trim();
    const img = card.querySelector('img');
    pratos[nome] = { nome, preco: lerPreco(card.querySelector('.item__price').textContent), img };
  });

  // Estado: { "Uramaki Filadélfia": 2, ... }
  let carrinho = {};
  try { carrinho = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { carrinho = {}; }
  Object.keys(carrinho).forEach((n) => { if (!pratos[n] || !(carrinho[n] > 0)) delete carrinho[n]; });

  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (e) { /* modo privado */ } };
  const qtdTotal = () => Object.values(carrinho).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(carrinho).reduce((s, [n, q]) => s + pratos[n].preco * q, 0);
  const entrega = () => formCarrinho.elements.modo.value === 'entrega';
  const taxa = () => (entrega() && qtdTotal() > 0 ? TAXA_ENTREGA : 0);

  function render() {
    const qtd = qtdTotal();
    const sub = subtotal();

    // Contadores fora do carrinho
    badge.textContent = qtd;
    badge.hidden = qtd === 0;
    barra.hidden = qtd === 0;
    $('cart-bar-count').textContent = qtd;
    $('cart-bar-total').textContent = real(sub);
    barra.setAttribute('aria-label', `Ver pedido: ${qtd} ${qtd === 1 ? 'item' : 'itens'}, ${real(sub)}`);

    // Lista de itens
    lista.innerHTML = Object.entries(carrinho).map(([nome, q]) => {
      const p = pratos[nome];
      const foto = p.img ? (p.img.currentSrc || p.img.src) : '';
      return `<li class="cart__item">
        <img class="cart__thumb" src="${esc(foto)}" alt="">
        <div class="cart__info"><strong>${esc(nome)}</strong><span>${real(p.preco)} cada</span></div>
        <div class="cart__right">
          <div class="qty">
            <button type="button" data-op="-" data-nome="${esc(nome)}" aria-label="${q === 1 ? 'Remover' : 'Tirar um'} ${esc(nome)}">−</button>
            <span aria-label="Quantidade">${q}</span>
            <button type="button" data-op="+" data-nome="${esc(nome)}" aria-label="Mais um ${esc(nome)}">+</button>
          </div>
          <span class="cart__line">${real(p.preco * q)}</span>
        </div>
      </li>`;
    }).join('');

    const vazio = qtd === 0;
    $('cart-empty').hidden = !vazio;
    formCarrinho.hidden = vazio;
    $('cart-foot').hidden = vazio;

    // Endereço só é pedido na entrega
    $('cart-addr').hidden = !entrega();
    formCarrinho.elements.endereco.required = entrega();
    $('cart-fee-row').hidden = !entrega();

    $('cart-subtotal').textContent = real(sub);
    $('cart-fee').textContent = real(TAXA_ENTREGA);
    $('cart-total').textContent = real(sub + taxa());
  }

  function mudar(nome, delta) {
    carrinho[nome] = (carrinho[nome] || 0) + delta;
    if (carrinho[nome] <= 0) delete carrinho[nome];
    salvar();
    render();
  }

  // Abrir / fechar o painel
  let quemAbriu = null;
  function abrir() {
    quemAbriu = document.activeElement;
    $('cart-view-items').hidden = false;
    $('cart-view-done').hidden = true;
    render();
    dialogo.showModal();
    document.documentElement.classList.add('cart-aberto');
  }
  function fechar() { dialogo.close(); }
  dialogo.addEventListener('close', () => {
    document.documentElement.classList.remove('cart-aberto');
    if (quemAbriu && quemAbriu.focus) quemAbriu.focus();
  });
  // Clique no fundo escuro fecha
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) fechar(); });
  $('cart-close').addEventListener('click', fechar);
  $('cart-to-menu').addEventListener('click', fechar);
  barra.addEventListener('click', abrir);
  // "Pedir agora" do menu: com itens abre o carrinho; vazio, leva ao cardápio
  document.querySelector('.nav__cta').addEventListener('click', (e) => {
    if (qtdTotal() > 0) { e.preventDefault(); abrir(); }
  });

  // "+" dos cards do cardápio
  document.querySelectorAll('.add-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nome = btn.closest('.item').querySelector('h3').textContent.trim();
      mudar(nome, 1);

      // Retorno visual: o "+" vira ✓ por um instante e a barra dá um pulo
      btn.textContent = '✓';
      btn.classList.add('is-added');
      clearTimeout(btn._volta);
      btn._volta = setTimeout(() => { btn.textContent = '+'; btn.classList.remove('is-added'); }, 900);
      barra.classList.remove('is-bump');
      void barra.offsetWidth; // reinicia a animação
      barra.classList.add('is-bump');

      const q = qtdTotal();
      aviso.textContent = `${nome} adicionado. ${q} ${q === 1 ? 'item' : 'itens'} no pedido, ${real(subtotal())}.`;
    });
  });

  // − / + dentro do carrinho
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-op]');
    if (!b) return;
    const nome = b.dataset.nome;
    mudar(nome, b.dataset.op === '+' ? 1 : -1);
    // mantém o foco num botão da mesma linha (ou no fechar, se a linha sumiu)
    const igual = lista.querySelector(`button[data-op="${b.dataset.op}"][data-nome="${CSS.escape(nome)}"]`)
      || lista.querySelector(`button[data-nome="${CSS.escape(nome)}"]`);
    (igual || $('cart-close')).focus();
  });

  formCarrinho.addEventListener('change', (e) => { if (e.target.name === 'modo') render(); });

  // Enviar: monta a mensagem completa do pedido
  formCarrinho.addEventListener('submit', (e) => {
    e.preventDefault();
    if (qtdTotal() === 0) return;
    const d = Object.fromEntries(new FormData(formCarrinho));
    const linhas = Object.entries(carrinho).map(([n, q]) => `${q}x ${n} — ${real(pratos[n].preco * q)}`);
    const sub = subtotal();
    const msg = [
      'Olá! Quero fazer um pedido pelo site:',
      '',
      ...linhas,
      '',
      `Subtotal: ${real(sub)}`,
      entrega() ? `Entrega: ${real(TAXA_ENTREGA)}` : 'Retirada no balcão',
      `*Total: ${real(sub + taxa())}*`,
      '',
      `Nome: ${d.nome}`,
      entrega() ? `Endereço: ${d.endereco}` : null,
      `Pagamento: ${d.pagamento}`,
      d.obs && d.obs.trim() ? `Observações: ${d.obs.trim()}` : null,
    ].filter((l) => l !== null).join('\n');

    if (WHATSAPP_NUMERO) {
      window.open(linkWhats(msg), '_blank', 'noopener');
      $('cart-done-text').textContent = 'Abrimos o WhatsApp com o seu pedido. É só tocar em enviar. Esta foi a mensagem:';
    } else {
      $('cart-done-text').textContent = 'Demonstração (site de portfólio): no site real, este botão abre o WhatsApp com a mensagem abaixo já escrita.';
    }
    $('cart-preview').textContent = msg.replace(/\*/g, ''); // *negrito* só faz sentido dentro do WhatsApp

    carrinho = {};
    salvar();
    formCarrinho.reset();
    render();
    $('cart-view-items').hidden = true;
    $('cart-view-done').hidden = false;
    $('cart-new').focus();
  });

  $('cart-new').addEventListener('click', fechar);

  render();
})();

// ---------- Formulário de reserva → WhatsApp ----------
const form = document.getElementById('form-reserva');
const status = document.getElementById('form-status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  const msg = 'Olá! Gostaria de reservar uma mesa.\n\n' +
    `Nome: ${d.nome}\nWhatsApp: ${d.whatsapp}\nLocal: ${d.local}\nPessoas: ${d.pessoas}` +
    (d.balcao ? '\nPrefiro lugar no balcão.' : '');

  if (!WHATSAPP_NUMERO) {
    // Site de portfólio: sem número real, só simula a confirmação
    status.textContent = `Obrigado, ${d.nome.split(' ')[0]}! Recebemos seu pedido de reserva para ${d.pessoas} ${Number(d.pessoas) === 1 ? 'pessoa' : 'pessoas'}. (Demonstração: nenhuma mensagem foi enviada.)`;
    form.reset();
    return;
  }
  window.open(linkWhats(msg), '_blank', 'noopener');
  status.textContent = 'Abrimos o WhatsApp com seu pedido. É só enviar a mensagem!';
  form.reset();
});

// Ano do rodapé
document.getElementById('ano').textContent = new Date().getFullYear();
