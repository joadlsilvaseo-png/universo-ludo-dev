import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const IMG = /^\/assets\/materias\/[a-f0-9-]{36}\.(png|jpg|webp)$/i;
const $ = (s) => document.querySelector(s);
const status = $("#article-status");
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function safeHtml(input) {
  const parsed = new DOMParser().parseFromString(String(input || ""), "text/html");
  const allowed = new Set(["p", "h2", "h3", "b", "i", "strong", "em",
    "blockquote", "ul", "ol", "li", "figure", "figcaption", "br"]);
  const blocked = new Set(["script", "style", "iframe", "object", "svg", "form", "template"]);
  function nodeHtml(node) {
    if (node.nodeType === Node.TEXT_NODE) return esc(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    if (blocked.has(tag)) return "";
    if (tag === "img") {
      const src = node.getAttribute("src");
      return IMG.test(src || "") ?
        `<img src="${esc(src)}" alt="${esc(node.getAttribute("alt") || "Imagem da matéria")}" loading="lazy">` : "";
    }
    const children = [...node.childNodes].map(nodeHtml).join("");
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      return /^https?:\/\//i.test(href) ?
        `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${children}</a>` : children;
    }
    if (!allowed.has(tag)) return children;
    if (tag === "br") return "<br>";
    return `<${tag}>${children}</${tag}>`;
  }
  return [...parsed.body.childNodes].map(nodeHtml).join("");
}
async function init() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
    status.textContent = "Matéria não encontrada.";
    return;
  }
  try {
    const snap = await getDoc(doc(db, "materias", id));
    if (!snap.exists() || snap.data().status !== "publicado") {
      status.textContent = "Matéria indisponível ou não publicada.";
      return;
    }
    const a = snap.data();
    document.title = a.titulo + " | Ludo Conecta";
    document.querySelector('meta[name="description"]').content = a.metaDescription || a.resumo || "";
    $("#article-category").textContent = a.categoriaNome || "Ludo Conecta";
    $("#article-title").textContent = a.titulo;
    if (a.subtitulo) { $("#article-subtitle").textContent = a.subtitulo; $("#article-subtitle").hidden = false; }
    $("#article-author").textContent = "Por " + (a.autorNome || "Equipe Ludo Conecta");
    const date = String(a.dataPublicacao || a.atualizadoEm || "").slice(0, 10);
    if (date) {
      $("#article-date").dateTime = date;
      $("#article-date").textContent = date.split("-").reverse().join("/");
    }
    $("#article-reading-time").textContent = (Number(a.tempoLeitura) || 5) + " min de leitura";
    if (IMG.test(a.imagemCapaUrl || "")) {
      $("#article-cover-image").src = a.imagemCapaUrl;
      $("#article-cover-image").alt = a.imagemCapaAlt || a.titulo;
      if (a.legendaCapa) {
        $("#article-caption").textContent = a.legendaCapa;
        $("#article-caption").hidden = false;
      }
      $("#article-cover").hidden = false;
    }
    $("#article-content").innerHTML = safeHtml(a.conteudoHtml);
    status.hidden = true; $("#article").hidden = false;
  } catch (err) {
    console.error("Ludo Conecta: não foi possível ler a matéria.", err);
    status.textContent = "Não foi possível carregar a matéria agora.";
  }
}
init();
