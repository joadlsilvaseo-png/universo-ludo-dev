# Ludo Conecta — dois editores, fontes independentes

O Ludo Conecta mantém **dois caminhos de publicação**, sem migrar matérias nem sincronizar a edição entre os painéis.

## 1. CMS personalizado (Firebase)

- Repositório do editor: `joadlsilvaseo-png/cms-ludo-conecta`.
- Matérias criadas nesse painel permanecem no Firestore, coleção `materias`.
- Para editar uma matéria que já está no CMS antigo, **use somente o CMS antigo**.
- O site consulta as matérias com `status = publicado` e preserva links e URLs estáticas existentes.
- Nenhum dado do Firebase foi apagado.

## 2. Pages CMS (GitHub)

1. Entre em https://app.pagescms.org/ usando a conta `joadlsilvaseo-png`.
2. Autorize o repositório `joadlsilvaseo-png/universo-ludo-dev` para o Pages CMS, caso ainda não esteja autorizado.
3. Use a branch `main` e a coleção **Artigos do Ludo Conecta**.
4. Os artigos novos são salvos em `content/ludo-conecta/articles/*.json`.
5. Ative **Aprovado para publicação** apenas quando o artigo estiver revisado.
6. O GitHub Actions **Ludo Conecta - publicar artigos do Pages CMS** gera a página e atualiza `content/ludo-conecta/posts.json`, `pages-manifest.json` e `sitemap.xml`.
7. Use **Destacar no blog** para priorizar um artigo entre os até três destaques. O **Mais recente** é automático pela data de publicação (e nunca se repete nos destaques). Quando não houver três artigos marcados, a vitrine usa outros artigos publicados para completar os espaços disponíveis.

Os novos artigos do Pages CMS têm URLs em `/ludo-conecta/materias/{slug}/`. **Não reutilize o slug de uma matéria que já exista no CMS personalizado**, nem altere o slug de uma URL publicada sem providenciar o redirecionamento correspondente.

## Vitrines e imagens — padrão editorial Isabele, identidade Ludo

- Na landing da Universo Ludo e no portal Ludo Conecta, o artigo mais recente ganha card principal com capa 4:3 e, ao lado no desktop/abaixo no mobile, ficam até três destaques horizontais.
- No mobile, os destaques aceitam swipe e têm setas e indicadores quando houver mais de um artigo. No desktop, ficam empilhados.
- O botão **Ver todos** abre `/ludo-conecta/todos/`, que reúne todos os artigos publicados dos dois CMS e não inclui rascunhos.
- **Imagens de capa:** recomendado 1200 × 900 px (4:3), WebP/JPG, foto real autorizada, texto alternativo descritivo. Cards exibem a proporção 4:3 com corte proporcional (object-fit: cover), como na Isabele.
- **Imagens internas:** conservam a proporção original, sem distorção ou corte, com bordas arredondadas e legenda opcional. O Pages CMS transforma um parágrafo após a imagem com prefixo `Legenda:`, `Foto:`, `Crédito:`, `Imagem:` ou `Fonte:` em legenda vinculada à foto.
- O campo **Aprovado para publicação** permanece desligado em rascunhos; imagem e data podem ficar vazias em rascunhos, mas o gerador exige capa, ALT, data e SEO na publicação.
- A grade visual é compartilhada com o modelo Isabele, mas a paleta, as marcas, os links e os conteúdos do Ludo Conecta não se misturam.

## Como o site funciona

- A página inicial da Universo Ludo e o blog Ludo Conecta leem as matérias **publicadas** das duas fontes em separado.
- As duas listas são reunidas **somente para exibição**, sem copiar, editar ou sincronizar os registros de origem.
- Em caso de slug repetido, a listagem dá preferência à matéria do CMS personalizado; a melhor prática é nunca repetir um slug.
- Falha temporária de uma fonte não impede a apresentação dos artigos da outra.
- As páginas do CMS antigo e suas URLs permanecem intactas. O gerador do Pages CMS é limitado aos artigos criados pelo Pages.

## Arquivos e responsabilidades

- `.pages.yml`: definição do editor Pages CMS.
- `content/ludo-conecta/articles/*.json`: artigos de responsabilidade do Pages CMS.
- `content/ludo-conecta/posts.json`: catálogo gerado somente pelo Pages CMS.
- `content/ludo-conecta/pages-manifest.json`: registro de páginas publicadas pelo Pages CMS.
- `content/ludo-conecta/manifest.json`: registro antigo, mantido para links do CMS personalizado.
- `js/ludo-publications.js`: consulta independente às duas fontes e integração somente na listagem.
- `scripts/build_ludo_blog.py`: gerador do Pages CMS, sem eliminar conteúdo do CMS antigo.

**Não desative a hospedagem, a autenticação ou o Firebase do CMS personalizado** enquanto o editor antigo continuar em uso.
