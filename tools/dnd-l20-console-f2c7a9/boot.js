(async () => {
  const loader = document.getElementById("loader");
  try {
    if (!("DecompressionStream" in window)) throw new Error("This browser does not support the required built-in decompressor.");
    const encoded = window.__DND_PAYLOAD || "";
    if (!encoded) throw new Error("The character-console payload did not load.");
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const html = await new Response(stream).text();
    window.__DND_PAYLOAD = "";
    document.open();
    document.write(html);
    document.close();
  } catch (error) {
    console.error(error);
    if (loader) loader.innerHTML = `<strong>Unable to load the console</strong><p>${String(error.message || error)} Please use a current version of Safari, Chrome, Edge, or Firefox.</p>`;
  }
})();
