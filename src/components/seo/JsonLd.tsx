/**
 * Инъектор structured data (Schema.org). Рендерится на сервере.
 * Использование: <JsonLd data={productJsonLd(product)} />
 */
export function JsonLd({ data }: { data: unknown }) {
  // Экранируем "<", чтобы содержимое не могло закрыть тег </script> (защита от XSS).
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
