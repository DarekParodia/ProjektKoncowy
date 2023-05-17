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
        if (!mobileButtKlikniety) {
            mobileButt.setAttribute("class", "divbtn menu-div-pojda-glowny");
            mobileMenu.setAttribute("class", "mxnMenu mxnMenuShown");
            //  mobileMenu.hidden = false;
        } else {
            mobileButt.setAttribute("class", "divbtn");
            mobileMenu.setAttribute("class", "mxnMenu");
            //  mobileMenu.hidden = true;
        }
        mobileButtKlikniety = !mobileButtKlikniety;
    });
    console.log("loaded");
});
window.addEventListener("resize", (e) => {
    if (window.innerWidth > 960) {
    }
});
function joinGame() {}
