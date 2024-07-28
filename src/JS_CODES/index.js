var navbar = document.querySelector("#nav");
document.addEventListener("scroll", () => {
  if (navbar.getBoundingClientRect().top <= 20) {
    navbar.querySelectorAll("ul a").forEach((ele) => {
      ele.classList.add("lg:ml-8");
      ele.classList.add("ml-4");
    });
    navbar.querySelector("#titleName").classList.remove("md:hidden");
    navbar.querySelector("ul").classList.remove("w-screen");
  } else {
    navbar.querySelectorAll("ul a").forEach((ele) => {
      ele.classList.remove("lg:ml-8");
      ele.classList.remove("ml-4");
    });
    navbar.querySelector("#titleName").classList.add("md:hidden");
    navbar.querySelector("ul").classList.add("w-screen");
  }
});
