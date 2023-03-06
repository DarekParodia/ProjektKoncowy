document.addEventListener("DOMContentLoaded", (e) => {
    var mobileButt = document.getElementById("mobileButt");
    var mobileMenu = document.getElementById("mobileMenu");
    var mobileButtKlikniety = false;
    mobileButt.addEventListener("click", (e) => {
        let cntr = 0;
        for (const child of mobileButt.children) {
            cntr++;
            if (mobileButtKlikniety) child.setAttribute("class", `menu-div-pojda`);
            else child.setAttribute("class", `menu-div-pojda-klikniete` + cntr);
        }
        mobileButtKlikniety = !mobileButtKlikniety;
    });
    console.log("loaded");
});
