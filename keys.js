export class Key {
    constructor(letter="?", setLetter=null) {
        this.l = letter;
        this.a = false;
        this.e = null;
        this.f = setLetter;
    }
    manifest(parent, x=0,y=0) {
        if (!this.e) {
            this.e = document.createElement("div");
            this.e.setAttribute("class", "keys");
            this.e.innerText = this.l;
            this.e.setAttribute("data-active", this.a ? "1" : "0");
            
            this.e.addEventListener("click", this.toggle.bind(this, true));
        }
        this.e.style.left = x + "px";
        this.e.style.bottom = y + "px";
        parent.appendChild(this.e);
    }
    activate(internal=false) {
        this.a = true;
        if (this.e) this.e.setAttribute("data-active", "1");
        this.setExternalLetter(internal);
    }
    deactivate(internal=false) {
        this.a = false;
        if (this.e) this.e.setAttribute("data-active", "0");
        this.setExternalLetter(internal);
    }
    toggle(internal=false) {
        (this.a) ? this.deactivate(internal) : this.activate(internal);
    }
    setState(state) {
        if (state) this.activate();
        else this.deactivate();
    }
    setExternalLetter(internal) {
        if (internal && this.f) this.f(this.a, this.l);
    }
}