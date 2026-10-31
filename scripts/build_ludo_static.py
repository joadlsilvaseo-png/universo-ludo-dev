#!/usr/bin/env python3
"""Gera HTML SEO e sitemap a partir SOMENTE das matérias publicadas do Firestore.

Execução local ou no GitHub Actions: python3 scripts/build_ludo_static.py
Sem credenciais administrativas. A consulta respeita as regras públicas do Firestore.
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://universoludo.com.br"
BASE = "/ludo-conecta/materias/"
OUTPUT = ROOT / "ludo-conecta" / "materias"
MANIFEST = ROOT / "content" / "ludo-conecta" / "manifest.json"
SITEMAP = ROOT / "sitemap.xml"
PROJECT = "cms-ludo-conecta"
# Chave pública do SDK Web, NÃO uma credencial de administrador.
API_KEY = os.environ.get("FIREBASE_API_KEY", "AIzaSyDgCFLFqSKuoloV6iRkwu4Iparz2OhEsQ4")
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
IMAGE = re.compile(r"^/assets/materias/[a-f0-9-]{36}\.(?:png|jpg|webp)$", re.I)
SAFE_TAGS = {"p", "h2", "h3", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "figure", "figcaption", "br"}
SKIP_TAGS = {"script", "style", "iframe", "svg", "object", "form", "template"}
XML = "http://www.sitemaps.org/schemas/sitemap/0.9"


def h(value):
    return html.escape(str(value if value is not None else ""), quote=True)


def slugify(value):
    import unicodedata
    normalized = unicodedata.normalize("NFD", str(value or ""))
    ascii_text = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())).strip("-")


def from_firestore(value):
    if "stringValue" in value:
        return value["stringValue"]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "doubleValue" in value:
        return value["doubleValue"]
    if "booleanValue" in value:
        return value["booleanValue"]
    if "timestampValue" in value:
        return value["timestampValue"]
    if "nullValue" in value:
        return None
    if "arrayValue" in value:
        return [from_firestore(v) for v in value["arrayValue"].get("values", [])]
    if "mapValue" in value:
        return {k: from_firestore(v) for k, v in value["mapValue"].get("fields", {}).items()}
    return None


def get_public_articles():
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents:runQuery?key={API_KEY}"
    payload = {
        "structuredQuery": {
            "from": [{"collectionId": "materias"}],
            "where": {"fieldFilter": {
                "field": {"fieldPath": "status"}, "op": "EQUAL",
                "value": {"stringValue": "publicado"}
            }}
        }
    }
    request = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=35) as response:
        items = json.load(response)
    if not isinstance(items, list):
        raise RuntimeError("Resposta inesperada do Firestore; geração interrompida.")
    articles = []
    for item in items:
        doc = item.get("document")
        if not doc:
            continue
        data = {k: from_firestore(v) for k, v in doc.get("fields", {}).items()}
        if data.get("status") != "publicado":
            continue
        data["_firestoreId"] = doc["name"].rsplit("/", 1)[-1]
        articles.append(data)
    return articles


class CleanArticle(HTMLParser):
    """Lista restrita: remove scripts, eventos e URLs não autorizadas do corpo."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.stack = []
        self.block_depth = 0

    def handle_starttag(self, tag, attrs):
        if self.block_depth:
            if tag in SKIP_TAGS:
                self.block_depth += 1
            return
        if tag in SKIP_TAGS:
            self.block_depth = 1
            return
        attrs = dict(attrs)
        if tag == "img":
            src = attrs.get("src") or ""
            if IMAGE.fullmatch(src):
                self.out.append('<img src="' + h(src) + '" alt="' +
                                h(attrs.get("alt", "Imagem da matéria")) + '" loading="lazy">')
            return
        if tag == "a":
            link = attrs.get("href") or ""
            parsed = urlparse(link)
            if parsed.scheme in ("https", "http") and parsed.netloc:
                self.out.append('<a href="' + h(link) + '" rel="noopener noreferrer" target="_blank">')
                self.stack.append("a")
            else:
                self.stack.append(None)
            return
        if tag == "br":
            self.out.append("<br>")
            return
        if tag in SAFE_TAGS:
            self.out.append("<" + tag + ">")
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if self.block_depth:
            if tag in SKIP_TAGS:
                self.block_depth -= 1
            return
        if tag not in SAFE_TAGS and tag != "a":
            return
        if not self.stack:
            return
        # Só fecha nós permitidos e corretamente aninhados.
        if self.stack[-1] == tag:
            self.stack.pop()
            self.out.append("</" + tag + ">")

    def handle_data(self, data):
        if not self.block_depth:
            self.out.append(h(data))

    def html(self):
        for tag in reversed(self.stack):
            if tag:
                self.out.append("</" + tag + ">")
        return "".join(self.out)


def clean_content(source):
    parser = CleanArticle()
    parser.feed(str(source or ""))
    return parser.html()


def iso_date(value):
    value = str(value or "")[:10]
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        return ""


def render_article(article):
    slug = article["_slug"]
    url = SITE + BASE + slug + "/"
    title = str(article.get("titulo") or "Matéria")
    description = str(article.get("metaDescription") or article.get("resumo") or "")[:200]
    cover = article.get("imagemCapaUrl") or ""
    cover = cover if IMAGE.fullmatch(cover) else "/assets/ludo-conecta.png"
    image = SITE + cover
    published = iso_date(article.get("dataPublicacao") or article.get("atualizadoEm"))
    updated = iso_date(article.get("atualizadoEm") or article.get("dataPublicacao"))
    author = str(article.get("autorNome") or "Equipe Ludo Conecta")
    jsonld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "url": url,
        "image": [image],
        "author": {"@type": "Person", "name": author},
        "publisher": {"@type": "Organization", "name": "Universo Ludo",
                      "logo": {"@type": "ImageObject", "url": SITE + "/assets/logo-universo-ludo.png"}},
        "datePublished": published,
        "dateModified": updated,
        "inLanguage": "pt-BR"
    }
    structured = json.dumps(jsonld, ensure_ascii=False).replace("<", "\\u003c")
    sub = ('<p class="lc-subtitle">' + h(article["subtitulo"]) + "</p>") if article.get("subtitulo") else ""
    byline = "Por " + h(author)
    published_date = ('<time datetime="' + published + '">' +
                      h(date.fromisoformat(published).strftime("%d/%m/%Y")) + "</time>") if published else ""
    caption = h(article.get("legendaCapa") or "")
    credit = h(article.get("creditoCapa") or "")
    figure_caption = ('<figcaption>' + caption + (' · ' + credit if credit else "") + "</figcaption>") if (caption or credit) else ""
    figure = ('<figure class="lc-cover"><img src="' + h(cover) + '" alt="' +
              h(article.get("imagemCapaAlt") or title) + '" width="1200" loading="eager">' +
              figure_caption + "</figure>")
    body = clean_content(article.get("conteudoHtml"))
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <title>{h(title)} | Ludo Conecta</title>
  <meta name="description" content="{h(description)}">
  <link rel="canonical" href="{h(url)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Universo Ludo">
  <meta property="og:title" content="{h(title)} | Ludo Conecta">
  <meta property="og:description" content="{h(description)}">
  <meta property="og:url" content="{h(url)}">
  <meta property="og:image" content="{h(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{h(title)} | Ludo Conecta">
  <meta name="twitter:description" content="{h(description)}">
  <meta name="twitter:image" content="{h(image)}">
  <link rel="icon" href="/assets/ludo-conecta.png">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/ludo-share.css">
  <script type="application/ld+json">{structured}</script>
  <style>
  body{{margin:0;background:#f6f5fc;color:#15172b;font-family:Inter,Arial,sans-serif}}
  .lc-top{{background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 24px}}
  .lc-top a{{display:inline-flex;align-items:center;gap:10px;font-weight:850;color:#6533c0;text-decoration:none}}
  .lc-top img{{width:52px;height:52px;object-fit:contain}}
  .lc-shell{{width:min(100% - 36px,850px);margin:32px auto 72px}}
  .lc-back{{display:inline-block;margin:0 0 22px;color:#6d28d9;text-decoration:none;font-weight:750}}
  .lc-card{{background:#fff;border:1px solid #e6e3ed;border-radius:22px;padding:clamp(22px,5vw,52px);box-shadow:0 12px 35px #20104a09}}
  .lc-tag{{color:#7c3aed;font-size:.84rem;text-transform:uppercase;letter-spacing:.09em;font-weight:900}}
  h1{{font-size:clamp(2rem,5vw,3.2rem);line-height:1.12;overflow-wrap:anywhere;margin:16px 0}}
  .lc-subtitle{{font-size:1.12rem;color:#475569;line-height:1.65}}
  .lc-meta{{display:flex;gap:15px;flex-wrap:wrap;color:#64748b;margin:19px 0 30px;font-size:.9rem}}
  .lc-cover{{margin:20px 0 35px}}.lc-cover img{{width:100%;height:auto;border-radius:16px}}
  .lc-cover figcaption{{font-size:.87rem;color:#64748b;margin-top:9px}}
  .lc-content{{font-size:1.06rem;line-height:1.85;overflow-wrap:anywhere}}
  .lc-content p,.lc-content ul,.lc-content ol,.lc-content blockquote,.lc-content figure{{margin:0 0 23px}}
  .lc-content h2,.lc-content h3{{margin:34px 0 14px}}
  .lc-content h2{{font-size:1.6rem}}.lc-content h3{{font-size:1.3rem}}
  .lc-content a{{color:#6d28d9;text-decoration:underline}}
  .lc-content img{{max-width:100%;height:auto;border-radius:13px}}
  .lc-content figcaption{{font-size:.85rem;color:#64748b}}
  .lc-content blockquote{{border-left:4px solid #7c3aed;padding-left:20px}}
  .lc-content ul{{list-style:disc;padding-left:24px}}.lc-content ol{{list-style:decimal;padding-left:24px}}
  @media(max-width:600px){{.lc-shell{{margin:18px auto 40px}}.lc-card{{border-radius:16px}}h1{{font-size:1.92rem}}}}
  </style>
</head>
<body>
<header class="lc-top"><a href="/ludo-conecta/"><img src="/assets/ludo-conecta.png" alt="Ludo Conecta"> Ludo Conecta</a></header>
<main class="lc-shell">
  <a class="lc-back" href="/ludo-conecta/">← Voltar ao blog</a>
  <article class="lc-card">
    <header><span class="lc-tag">{h(article.get("categoriaNome") or "Ludo Conecta")}</span>
      <h1>{h(title)}</h1>{sub}
      <div class="lc-meta"><span>{byline}</span>{published_date}
        <span>{int(article.get("tempoLeitura") or 5)} min de leitura</span></div>
    </header>
    <div class="lc-share" data-ludo-share aria-label="Compartilhar esta matéria"></div>
    {figure}
    <div class="lc-content">{body}</div>
    <div class="lc-share" data-ludo-share aria-label="Compartilhar esta matéria"></div>
  </article>
</main>
<script src="/js/ludo-share.js" defer></script>
</body>
</html>
'''


def update_sitemap(articles):
    # Preserva URLs preexistentes que não pertencem às matérias.
    ET.register_namespace("", XML)
    tree = ET.parse(SITEMAP)
    root = tree.getroot()
    namespace = "{" + XML + "}"
    for node in list(root):
        loc = node.find(namespace + "loc")
        if loc is not None and loc.text and BASE in loc.text:
            root.remove(node)
    for article in articles:
        node = ET.SubElement(root, namespace + "url")
        ET.SubElement(node, namespace + "loc").text = SITE + BASE + article["_slug"] + "/"
        modified = iso_date(article.get("atualizadoEm") or article.get("dataPublicacao"))
        if modified:
            ET.SubElement(node, namespace + "lastmod").text = modified
    ET.indent(tree, space="  ")
    tree.write(SITEMAP, encoding="utf-8", xml_declaration=True)


def main():
    articles = get_public_articles()
    slugs = set()
    for article in articles:
        slug = slugify(article.get("slug") or article.get("titulo"))
        if not SLUG.fullmatch(slug or "") or not article.get("titulo") or not article.get("conteudoHtml"):
            raise RuntimeError("Matéria publicada sem slug/título/conteúdo válido: " + str(article["_firestoreId"]))
        if slug in slugs:
            raise RuntimeError("Slugs duplicados no Firestore: " + slug)
        article["_slug"] = slug
        slugs.add(slug)
    articles.sort(key=lambda a: (str(a.get("dataPublicacao") or ""), a["_slug"]), reverse=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for file in OUTPUT.glob("*/index.html"):
        if file.parent.name not in slugs:
            file.unlink()
            try:
                file.parent.rmdir()
            except OSError:
                pass
    for article in articles:
        directory = OUTPUT / article["_slug"]
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "index.html").write_text(render_article(article), encoding="utf-8")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({
        "schemaVersion": 1,
        "articles": {a["_slug"]: BASE + a["_slug"] + "/" for a in articles}
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_sitemap(articles)
    print(f"Ludo Conecta: {len(articles)} HTML(s) e sitemap atualizados.")


if __name__ == "__main__":
    try:
        main()
    except (urllib.error.URLError, RuntimeError, ValueError, OSError) as error:
        print("ERRO: geração abortada sem publicar novos arquivos:", error, file=sys.stderr)
        sys.exit(1)
