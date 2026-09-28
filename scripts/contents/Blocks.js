class Blocks {
    static async load() {
        console.log(Global.atlas)
        this.air = new Block({ solid: false });
        this.grass = new Block({
            solid: false,
            region: Global.atlas.find("grass")
        });

        console.log("Blocks loaded. Grass region:", this.grass.region);
    }
}