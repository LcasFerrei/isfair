/*
 * Termos de uso e Política de privacidade.
 * A versão em português prevalece; o inglês é a tradução oficial e serve aos demais idiomas do app.
 * Ao mudar o que o app coleta ou com quem compartilha, atualize os dois idiomas e LEGAL_UPDATED_AT (config.ts).
 * {email} é trocado pelo CONTACT_EMAIL.
 */

export type LegalDoc = 'terms' | 'privacy';
export type LegalLang = 'pt' | 'en';

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  /** Lista opcional depois dos parágrafos: [termo em destaque, explicação] */
  items?: [string, string][];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const TERMS_PT: LegalDocument = {
  title: 'Termos de uso',
  intro:
    'Estes Termos explicam as regras para usar o IsFair, pelo site ou pelo app instalado. Ao usar o IsFair, você concorda com eles. Se não concordar, não use o serviço.',
  sections: [
    {
      id: 'servico',
      heading: '1. O que é o IsFair',
      paragraphs: [
        'O IsFair é uma ferramenta gratuita e informativa para viajantes: estima o preço justo de produtos e serviços na cidade onde você está, mostra a cotação entre a sua moeda e a moeda local e ajuda a organizar o dinheiro vivo e o troco.',
        'O IsFair não vende produtos, não intermedeia compras, não guarda dinheiro e não processa pagamentos.',
      ],
    },
    {
      id: 'precos',
      heading: '2. Estimativas de preço e inteligência artificial',
      paragraphs: [
        'As faixas de preço justo, a identificação de produtos por foto, a leitura de etiquetas e as dicas são geradas por inteligência artificial (Google Gemini) e por dados de referência do app. São estimativas: podem estar desatualizadas, incompletas ou erradas, e os preços reais variam por local, horário, qualidade e negociação.',
        'Use o IsFair como apoio, não como garantia. A decisão de comprar, negociar ou recusar é sempre sua. O IsFair não é assessoria financeira, jurídica ou de consumo.',
      ],
    },
    {
      id: 'cambio',
      heading: '3. Cotações de câmbio',
      paragraphs: [
        'As cotações vêm de fontes públicas e são atualizadas cerca de uma vez por dia. Servem como referência e não correspondem ao valor que bancos, casas de câmbio ou operadoras de cartão aplicam, que costumam incluir taxas e margens.',
      ],
    },
    {
      id: 'carteira',
      heading: '4. Carteira e troco',
      paragraphs: [
        'A carteira é um controle que você mesmo preenche. As sugestões de quais cédulas entregar e de quanto troco receber dependem do que você informou. Confira sempre o dinheiro na hora da compra.',
        'As cédulas e moedas do app são ilustrações simplificadas, feitas para ajudar a reconhecer o dinheiro. Não são reproduções e não podem ser usadas como dinheiro.',
      ],
    },
    {
      id: 'conta',
      heading: '5. Conta',
      paragraphs: [
        'Criar uma conta é opcional. Nesta versão, a conta fica guardada apenas no aparelho em que foi criada. Você é responsável por manter sua senha em segurança e por tudo o que for feito com sua conta.',
      ],
    },
    {
      id: 'uso',
      heading: '6. Uso permitido',
      paragraphs: ['Você concorda em não:'],
      items: [
        ['Abusar do serviço', 'automatizar consultas, sobrecarregar os servidores ou tentar contornar os limites de uso da IA.'],
        ['Enviar conteúdo indevido', 'fotos de pessoas sem autorização, documentos pessoais, conteúdo ilegal, ofensivo ou que viole direitos de terceiros.'],
        ['Informar dados falsos', 'relatar preços inventados ou manipular as estatísticas da comunidade.'],
        ['Usar o app contra outras pessoas', 'constranger, ameaçar ou expor vendedores e comerciantes.'],
        ['Copiar o serviço', 'reproduzir, revender ou extrair em massa o conteúdo e o código do IsFair sem autorização.'],
      ],
    },
    {
      id: 'comunidade',
      heading: '7. Relatos da comunidade',
      paragraphs: [
        'Quando você informa quanto pagou por algo, o valor entra nas estatísticas de preço de forma anônima. Ao enviar um relato, você autoriza o IsFair a usá-lo, de forma gratuita e sem identificação, para melhorar as estimativas para todos.',
      ],
    },
    {
      id: 'anuncios',
      heading: '8. Anúncios',
      paragraphs: [
        'O IsFair é gratuito e pode exibir anúncios de terceiros, como os do Google AdSense. Os anúncios são de responsabilidade dos anunciantes; o IsFair não endossa os produtos anunciados. Como os anúncios usam dados está descrito na Política de privacidade.',
      ],
    },
    {
      id: 'propriedade',
      heading: '9. Propriedade intelectual',
      paragraphs: [
        'O nome IsFair, a logomarca, o design e o código do app pertencem aos seus criadores. Fotos de produtos podem vir do Open Food Facts, sob a licença aberta desse projeto, com o devido crédito. As marcas de produtos citadas pertencem aos seus donos.',
      ],
    },
    {
      id: 'responsabilidade',
      heading: '10. Limitação de responsabilidade',
      paragraphs: [
        'O IsFair é oferecido "como está", sem garantia de que estará sempre disponível ou livre de erros. Na medida permitida pela lei, o IsFair não se responsabiliza por prejuízos decorrentes de decisões tomadas com base nas estimativas, cotações ou sugestões do app. Nada nestes Termos limita direitos que você tenha pelo Código de Defesa do Consumidor ou por outra lei aplicável.',
      ],
    },
    {
      id: 'mudancas',
      heading: '11. Mudanças e encerramento',
      paragraphs: [
        'Podemos atualizar o IsFair e estes Termos. Mudanças relevantes serão avisadas no app antes de valer. Podemos suspender o acesso de quem violar estes Termos. Você pode parar de usar o IsFair a qualquer momento e apagar seus dados em Configurações.',
      ],
    },
    {
      id: 'lei',
      heading: '12. Lei aplicável',
      paragraphs: [
        'Estes Termos seguem as leis do Brasil. Eventuais disputas serão resolvidas no foro do domicílio do consumidor, quando a lei assim determinar.',
      ],
    },
    {
      id: 'contato',
      heading: '13. Contato',
      paragraphs: ['Dúvidas sobre estes Termos: {email}.'],
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of use',
  intro:
    'These Terms set out the rules for using IsFair, on the website or the installed app. By using IsFair, you agree to them. If you do not agree, do not use the service.',
  sections: [
    {
      id: 'servico',
      heading: '1. What IsFair is',
      paragraphs: [
        'IsFair is a free, informational tool for travelers: it estimates the fair price of goods and services in the city you are in, shows the exchange rate between your currency and the local one, and helps you organize cash and change.',
        'IsFair does not sell products, broker purchases, hold money or process payments.',
      ],
    },
    {
      id: 'precos',
      heading: '2. Price estimates and artificial intelligence',
      paragraphs: [
        'Fair price ranges, photo-based product identification, price tag reading and tips are generated by artificial intelligence (Google Gemini) and by the app’s reference data. They are estimates: they may be outdated, incomplete or wrong, and real prices vary by place, time, quality and negotiation.',
        'Use IsFair as a guide, not a guarantee. The decision to buy, negotiate or walk away is always yours. IsFair is not financial, legal or consumer advice.',
      ],
    },
    {
      id: 'cambio',
      heading: '3. Exchange rates',
      paragraphs: [
        'Exchange rates come from public sources and are updated about once a day. They are a reference and do not match the rates applied by banks, exchange offices or card issuers, which usually include fees and margins.',
      ],
    },
    {
      id: 'carteira',
      heading: '4. Wallet and change',
      paragraphs: [
        'The wallet is a record you fill in yourself. Suggestions about which notes to hand over and how much change to expect depend on what you entered. Always check the money at the time of purchase.',
        'The banknotes and coins in the app are simplified illustrations meant to help you recognize money. They are not reproductions and cannot be used as money.',
      ],
    },
    {
      id: 'conta',
      heading: '5. Account',
      paragraphs: [
        'Creating an account is optional. In this version, the account is stored only on the device where it was created. You are responsible for keeping your password safe and for everything done with your account.',
      ],
    },
    {
      id: 'uso',
      heading: '6. Acceptable use',
      paragraphs: ['You agree not to:'],
      items: [
        ['Abuse the service', 'automate requests, overload the servers or try to get around the AI usage limits.'],
        ['Upload improper content', 'photos of people without permission, personal documents, or illegal or offensive content that violates others’ rights.'],
        ['Submit false data', 'report made-up prices or manipulate community statistics.'],
        ['Use the app against others', 'embarrass, threaten or expose vendors and merchants.'],
        ['Copy the service', 'reproduce, resell or bulk-extract IsFair’s content or code without permission.'],
      ],
    },
    {
      id: 'comunidade',
      heading: '7. Community reports',
      paragraphs: [
        'When you report how much you paid for something, the amount is added to price statistics anonymously. By submitting a report, you allow IsFair to use it, free of charge and without identifying you, to improve estimates for everyone.',
      ],
    },
    {
      id: 'anuncios',
      heading: '8. Advertising',
      paragraphs: [
        'IsFair is free and may show third-party ads, such as Google AdSense. Advertisers are responsible for their ads; IsFair does not endorse the advertised products. How ads use data is described in the Privacy policy.',
      ],
    },
    {
      id: 'propriedade',
      heading: '9. Intellectual property',
      paragraphs: [
        'The IsFair name, logo, design and code belong to their creators. Product photos may come from Open Food Facts under that project’s open license, with credit. Product brands mentioned belong to their owners.',
      ],
    },
    {
      id: 'responsabilidade',
      heading: '10. Limitation of liability',
      paragraphs: [
        'IsFair is provided "as is", with no guarantee that it will always be available or error-free. To the extent permitted by law, IsFair is not liable for losses resulting from decisions based on the app’s estimates, rates or suggestions. Nothing in these Terms limits rights you have under the Brazilian Consumer Defense Code or other applicable law.',
      ],
    },
    {
      id: 'mudancas',
      heading: '11. Changes and termination',
      paragraphs: [
        'We may update IsFair and these Terms. Significant changes will be announced in the app before they take effect. We may suspend access for anyone who violates these Terms. You can stop using IsFair at any time and delete your data in Settings.',
      ],
    },
    {
      id: 'lei',
      heading: '12. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of Brazil. Disputes will be settled in the courts of the consumer’s place of residence where the law so requires.',
      ],
    },
    {
      id: 'contato',
      heading: '13. Contact',
      paragraphs: ['Questions about these Terms: {email}.'],
    },
  ],
};

const PRIVACY_PT: LegalDocument = {
  title: 'Política de privacidade',
  intro:
    'O IsFair foi feito para guardar o mínimo possível sobre você. Esta Política explica quais dados o app usa, onde eles ficam, com quem são compartilhados e como você controla tudo isso, conforme a Lei Geral de Proteção de Dados (LGPD) e o Regulamento Geral de Proteção de Dados europeu (GDPR).',
  sections: [
    {
      id: 'aparelho',
      heading: '1. O que fica só no seu aparelho',
      paragraphs: [
        'A maior parte dos dados do IsFair é guardada apenas no navegador do seu aparelho e não é enviada para nós:',
      ],
      items: [
        ['Preferências', 'idioma, cidade, moeda de casa, localização automática ligada ou não e preferências de notificação.'],
        ['Histórico', 'as últimas 50 verificações de preço, com item, valor, cidade e veredito.'],
        ['Carteira', 'as cédulas e moedas que você cadastrou e as últimas 100 movimentações.'],
        ['Notificações', 'os avisos gerados pelo app (as últimas 50).'],
        ['Conta', 'nome, e-mail e senha protegida por hash (PBKDF2), apenas neste aparelho, nesta versão.'],
        ['Cache', 'cotações, estimativas de preço (por 7 dias) e cidades recentes, para o app abrir rápido e gastar menos internet.'],
      ],
    },
    {
      id: 'fotos',
      heading: '2. Fotos e inteligência artificial',
      paragraphs: [
        'Quando você fotografa um produto, a imagem é enviada ao nosso servidor e repassada ao Google Gemini, junto com a cidade e o idioma, para identificar o item, ler o preço da etiqueta e estimar o preço justo. Nas verificações sem foto, enviamos só o nome do item, a cidade e o idioma.',
        'Não guardamos as fotos. Registros técnicos temporários do servidor podem conter mensagens de erro, sem a imagem.',
        'Importante: o IsFair usa o nível gratuito da API do Gemini. Nesse nível, o Google pode usar o conteúdo enviado para melhorar seus produtos, e pessoas podem revisá-lo. Por isso, fotografe só o produto: evite rostos, documentos, placas de carro ou qualquer informação pessoal.',
      ],
    },
    {
      id: 'localizacao',
      heading: '3. Localização',
      paragraphs: [
        'Se você permitir, o app usa a localização do aparelho para descobrir em que cidade você está. As coordenadas são enviadas ao serviço BigDataCloud apenas para converter em nome de cidade; o IsFair guarda só a cidade, não as coordenadas. Você pode desligar a localização automática em Configurações e escolher a cidade manualmente.',
      ],
    },
    {
      id: 'terceiros',
      heading: '4. Serviços de terceiros',
      paragraphs: ['Para funcionar, o IsFair conversa com estes serviços, que recebem o seu endereço IP e os dados indicados:'],
      items: [
        ['Google Gemini (Google)', 'fotos, nome do item, cidade e idioma, para identificação e estimativas.'],
        ['BigDataCloud', 'coordenadas, para descobrir a cidade.'],
        ['Open-Meteo', 'o texto que você digita na busca de cidades.'],
        ['ExchangeRate-API (open.er-api.com)', 'nenhum dado pessoal; só baixamos as cotações do dia.'],
        ['Open Food Facts', 'o nome do produto identificado, para buscar a foto da embalagem.'],
        ['Google Fonts', 'a fonte do app é carregada dos servidores do Google.'],
        ['Vercel', 'hospedagem do site e do servidor, com registros de acesso (IP, navegador, data).'],
        ['Google AdSense', 'anúncios, conforme a seção 5.'],
      ],
    },
    {
      id: 'anuncios',
      heading: '5. Anúncios e cookies',
      paragraphs: [
        'O IsFair é gratuito e se mantém com anúncios do Google AdSense, exibidos na página inicial, abaixo do Teste rápido, no fim do resultado de uma verificação, no histórico, no resumo da carteira e no menu lateral. Nunca durante a foto, o pagamento ou a edição da carteira.',
        'O Google e seus parceiros usam cookies e identificadores para mostrar anúncios, limitar repetições e medir resultados, inclusive com base em visitas anteriores a este e a outros sites. Na Europa, no Reino Unido e na Suíça, pedimos seu consentimento antes de anúncios personalizados; você pode mudar a escolha a qualquer momento.',
        'Saiba como o Google usa esses dados em policies.google.com/technologies/partner-sites e desative a personalização em adssettings.google.com.',
      ],
    },
    {
      id: 'finalidades',
      heading: '6. Para que usamos os dados (bases legais)',
      paragraphs: [],
      items: [
        ['Executar o serviço que você pediu', 'estimar preços, identificar produtos, converter moedas e calcular o troco.'],
        ['Consentimento', 'localização, notificações do sistema e anúncios personalizados. Você pode revogar quando quiser.'],
        ['Interesse legítimo', 'segurança, prevenção de abuso e melhoria do app, sempre com o mínimo de dados.'],
      ],
    },
    {
      id: 'retencao',
      heading: '7. Por quanto tempo',
      paragraphs: [
        'Os dados no seu aparelho ficam lá até você apagá-los. O histórico, a carteira e as notificações têm limite de itens, e as estimativas expiram em 7 dias. As fotos não são guardadas por nós. Os prazos de terceiros seguem as políticas de cada serviço.',
      ],
    },
    {
      id: 'direitos',
      heading: '8. Seus direitos',
      paragraphs: [
        'Você pode pedir confirmação e acesso aos dados, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revogação do consentimento (LGPD, art. 18, e GDPR).',
        'Como os seus dados ficam no seu aparelho, você mesmo controla a maior parte: em Configurações, apague o histórico e a carteira; ao limpar os dados do site no navegador, tudo do IsFair é removido. Para outros pedidos, escreva para {email}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD) ou à autoridade do seu país.',
      ],
    },
    {
      id: 'menores',
      heading: '9. Crianças e adolescentes',
      paragraphs: [
        'O IsFair não é direcionado a menores de 13 anos. Adolescentes devem usá-lo com autorização dos responsáveis.',
      ],
    },
    {
      id: 'seguranca',
      heading: '10. Segurança e transferência internacional',
      paragraphs: [
        'A comunicação com o IsFair é criptografada (HTTPS) e a senha da conta é guardada com hash. Alguns serviços de terceiros ficam fora do Brasil, como os do Google e da Vercel; nesses casos, a transferência segue as garantias previstas na LGPD e no GDPR.',
      ],
    },
    {
      id: 'mudancas',
      heading: '11. Mudanças nesta Política',
      paragraphs: [
        'Quando o IsFair passar a guardar dados na nuvem (por exemplo, para sincronizar a conta entre aparelhos), esta Política será atualizada antes. Mudanças relevantes serão avisadas no app.',
      ],
    },
    {
      id: 'contato',
      heading: '12. Contato',
      paragraphs: ['Dúvidas ou pedidos sobre privacidade: {email}.'],
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: 'Privacy policy',
  intro:
    'IsFair is built to keep as little about you as possible. This Policy explains what data the app uses, where it is stored, who it is shared with and how you control it, in line with Brazil’s General Data Protection Law (LGPD) and the EU General Data Protection Regulation (GDPR).',
  sections: [
    {
      id: 'aparelho',
      heading: '1. What stays on your device only',
      paragraphs: ['Most IsFair data is stored only in your device’s browser and is never sent to us:'],
      items: [
        ['Preferences', 'language, city, home currency, whether automatic location is on, and notification preferences.'],
        ['History', 'your last 50 price checks, with item, amount, city and verdict.'],
        ['Wallet', 'the notes and coins you entered and the last 100 transactions.'],
        ['Notifications', 'alerts generated by the app (the last 50).'],
        ['Account', 'name, email and a hashed password (PBKDF2), on this device only, in this version.'],
        ['Cache', 'exchange rates, price estimates (for 7 days) and recent cities, so the app opens fast and uses less data.'],
      ],
    },
    {
      id: 'fotos',
      heading: '2. Photos and artificial intelligence',
      paragraphs: [
        'When you photograph an item, the image is sent to our server and passed to Google Gemini, together with the city and language, to identify the item, read the price tag and estimate the fair price. For checks without a photo, we send only the item name, city and language.',
        'We do not store photos. Temporary technical server logs may contain error messages, without the image.',
        'Important: IsFair uses the free tier of the Gemini API. On that tier, Google may use submitted content to improve its products, and people may review it. So photograph only the item: avoid faces, documents, license plates or any personal information.',
      ],
    },
    {
      id: 'localizacao',
      heading: '3. Location',
      paragraphs: [
        'If you allow it, the app uses your device’s location to find out which city you are in. The coordinates are sent to the BigDataCloud service only to turn them into a city name; IsFair keeps the city, not the coordinates. You can turn off automatic location in Settings and choose the city manually.',
      ],
    },
    {
      id: 'terceiros',
      heading: '4. Third-party services',
      paragraphs: ['To work, IsFair talks to these services, which receive your IP address and the data listed:'],
      items: [
        ['Google Gemini (Google)', 'photos, item name, city and language, for identification and estimates.'],
        ['BigDataCloud', 'coordinates, to find your city.'],
        ['Open-Meteo', 'the text you type in the city search.'],
        ['ExchangeRate-API (open.er-api.com)', 'no personal data; we only download the day’s rates.'],
        ['Open Food Facts', 'the identified product name, to find a packaging photo.'],
        ['Google Fonts', 'the app’s font is loaded from Google’s servers.'],
        ['Vercel', 'hosting for the website and server, with access logs (IP, browser, date).'],
        ['Google AdSense', 'advertising, as described in section 5.'],
      ],
    },
    {
      id: 'anuncios',
      heading: '5. Ads and cookies',
      paragraphs: [
        'IsFair is free and supported by Google AdSense ads, shown on the home page, below Quick test, at the end of a price check result, in the history, in the wallet summary and in the side menu. Never while taking a photo, paying or editing the wallet.',
        'Google and its partners use cookies and identifiers to show ads, limit repetition and measure results, including based on previous visits to this and other websites. In the EU, the UK and Switzerland, we ask for your consent before personalized ads; you can change your choice at any time.',
        'Learn how Google uses this data at policies.google.com/technologies/partner-sites and turn off personalization at adssettings.google.com.',
      ],
    },
    {
      id: 'finalidades',
      heading: '6. Why we use data (legal bases)',
      paragraphs: [],
      items: [
        ['Providing the service you asked for', 'estimating prices, identifying items, converting currencies and calculating change.'],
        ['Consent', 'location, system notifications and personalized ads. You can withdraw it at any time.'],
        ['Legitimate interest', 'security, abuse prevention and improving the app, always with minimal data.'],
      ],
    },
    {
      id: 'retencao',
      heading: '7. How long',
      paragraphs: [
        'Data on your device stays there until you delete it. History, wallet and notifications have item limits, and estimates expire after 7 days. We do not store photos. Third-party retention follows each service’s policy.',
      ],
    },
    {
      id: 'direitos',
      heading: '8. Your rights',
      paragraphs: [
        'You can request confirmation of and access to your data, correction, anonymization, portability, deletion, information about sharing and withdrawal of consent (LGPD art. 18 and GDPR).',
        'Because your data lives on your device, you control most of it yourself: in Settings, clear the history and wallet; clearing the site data in your browser removes everything from IsFair. For other requests, write to {email}. You may also complain to Brazil’s National Data Protection Authority (ANPD) or to the authority in your country.',
      ],
    },
    {
      id: 'menores',
      heading: '9. Children and teenagers',
      paragraphs: ['IsFair is not directed at children under 13. Teenagers should use it with a parent or guardian’s permission.'],
    },
    {
      id: 'seguranca',
      heading: '10. Security and international transfers',
      paragraphs: [
        'Communication with IsFair is encrypted (HTTPS) and the account password is stored hashed. Some third-party services are located outside Brazil, such as Google and Vercel; in those cases, transfers follow the safeguards provided for in the LGPD and GDPR.',
      ],
    },
    {
      id: 'mudancas',
      heading: '11. Changes to this Policy',
      paragraphs: [
        'If IsFair starts storing data in the cloud (for example, to sync your account across devices), this Policy will be updated first. Significant changes will be announced in the app.',
      ],
    },
    {
      id: 'contato',
      heading: '12. Contact',
      paragraphs: ['Privacy questions or requests: {email}.'],
    },
  ],
};

export const LEGAL: Record<LegalDoc, Record<LegalLang, LegalDocument>> = {
  terms: { pt: TERMS_PT, en: TERMS_EN },
  privacy: { pt: PRIVACY_PT, en: PRIVACY_EN },
};
