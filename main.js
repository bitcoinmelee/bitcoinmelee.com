const $ = sel => document.querySelector(sel);
const rosterEl = $("#roster");
const msgEl    = $("#msg");

$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub")) {
    flash("Please paste a valid xpub.", true);
    return;
  }

  flash("Summoning heroes…");

  try {
    const res  = await fetch("/api/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xpub })
    });
    if (!res.ok) throw new Error(await res.text());
    const heroes = await res.json();  // [{name, strength, ...}, …]

    showRoster(heroes);
    flash("Choose your party!");
  } catch (err) {
    flash("Server error: " + err.message, true);
  }
});

function showRoster(heroes) {
  rosterEl.innerHTML = "";
  heroes.forEach(h => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="sprite"></div>
      <strong>${h.name}</strong><br/>
      <span class="stat">STR ${h.strength}</span><br/>
      <span class="stat">DEX ${h.dexterity}</span><br/>
      <span class="stat">CON ${h.constitution}</span>
    `;
    rosterEl.appendChild(card);
  });
  rosterEl.classList.remove("hidden");
}

function flash(text, bad=false){
  msgEl.textContent = text;
  msgEl.style.color = bad ? "#ff7272" : "#5ef35e";
}
