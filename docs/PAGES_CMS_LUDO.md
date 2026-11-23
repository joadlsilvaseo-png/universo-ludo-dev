# Ludo Conecta — Pages CMS

1. Entre em https://app.pagescms.org/ com a conta GitHub **joadlsilvaseo-png**.
2. Autorize o aplicativo Pages CMS no repositório **joadlsilvaseo-png/universo-ludo-dev** (a autorização é feita pelo proprietário).
3. Selecione a branch **main** e a coleção **Artigos do Ludo Conecta**.
4. Edite ou crie matérias, com título, subtítulo, categoria, tags, resumo, SEO, autor, capa, ALT, legenda, texto e imagens internas.
5. Para manter em rascunho, deixe **Aprovado para publicação** desligado. Ative quando houver aprovação editorial.
6. O GitHub Actions **Ludo Conecta - publicar artigos do Pages CMS** gera páginas HTML, listagem e sitemap. Não precisa acessar o CMS personalizado nem o Firebase.
7. O campo **Destacar no blog** prioriza matérias no portal; somente publicadas aparecem no site.

**URLs antigas preservadas:** /ludo-conecta/materias/{slug}/. Não altere o slug de matérias publicadas sem implementar redirecionamento 301.

**Arquivos:** `.pages.yml`, `content/ludo-conecta/articles/*.json`, `templates/ludo-article.html.tpl`, `scripts/build_ludo_blog.py`, `.github/workflows/ludo-blog-build.yml`.

**Prévia e auditoria local:** `python scripts/build_ludo_blog.py`. O gerador exige campos válidos e remove scripts e atributos potencialmente inseguros do corpo dos artigos. As páginas não dependem de Firebase para apresentar conteúdo.

**CMS antigo:** o repositório `cms-ludo-conecta` é mantido como histórico/backup. Para desativar totalmente a interface em produção, desligue seu projeto de hospedagem separadamente. Evite excluir o Firebase ou seus dados históricos sem backup e confirmação.
