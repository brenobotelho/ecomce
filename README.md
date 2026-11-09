# Agência é.com cê

Site institucional estático. Abra `index.html` no navegador ou sirva esta pasta com um servidor estático, como o Live Server do VS Code. O projeto não exige instalação nem compilação.

- `index.html`: página inicial e formulário.
- `projeto/index.html`: galeria de projetos fictícios, em `/projeto/`.
- `sobre/index.html`: história, personagens ilustrativos, serviços e espaço para parceiros, em `/sobre/`.
- `css/style.css` e `css/pages.css`: identidade visual, layout responsivo e animações.
- `js/script.js`: menu, contraste do cabeçalho, revelação ao rolar, filtros, faixa de retratos e contato.
- `img/`: favicon e versões da marca. `logo-escura.png` é usada em fundo claro; `logo-clara.png`, em fundo escuro. Para marcar uma nova seção escura, use a classe `section-dark` e o atributo `data-theme="dark"`.

O formulário monta uma mensagem para `comercial@agenciaecomce.com.br` no aplicativo de e-mail do visitante. Para habilitar envio direto ou WhatsApp, preencha `formEndpoint` ou `whatsapp` em `contactSettings`, no começo do JavaScript. O endpoint precisa aceitar POST com JSON e, se estiver em outro domínio, permitir a origem do site.

Os links “Sobre” e “Projetos” abrem as páginas internas. “Como funciona” leva às perguntas frequentes na página inicial.
