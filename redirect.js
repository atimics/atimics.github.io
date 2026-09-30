const prefix = "/nanogpt-macbook";
if (location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)) {
  const destination = new URL("https://cenetex.github.io/");
  destination.pathname = location.pathname === prefix ? `${prefix}/` : location.pathname;
  destination.search = location.search;
  destination.hash = location.hash;
  location.replace(destination.href);
}
