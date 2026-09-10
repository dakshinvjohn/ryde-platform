// ==========================================
// REVEAL ON SCROLL
// ==========================================

const revealElements = document.querySelectorAll(".reveal");
const revealGroups = document.querySelectorAll(".reveal-group");

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("show");

        }

    });

},{
    threshold:0.15
});

revealElements.forEach(element=>{

    observer.observe(element);

});

revealGroups.forEach(group=>{

    observer.observe(group);

});