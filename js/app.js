// Greeting button
document.getElementById("greet-btn").addEventListener("click", () => {
  const hour = new Date().getHours();
  const word = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greet-msg").textContent = word + "! JavaScript is working 🎉";
});

// Counter
let count = 0;
const countEl = document.getElementById("count");
document.getElementById("plus").addEventListener("click", () => { count++; countEl.textContent = count; });
document.getElementById("reset").addEventListener("click", () => { count = 0; countEl.textContent = count; });
