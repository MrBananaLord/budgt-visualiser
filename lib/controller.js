class Controller {
    constructor(converter) {
        this.converter = converter;

        $(document).on("click", "#fileInput button.close", e => $("#fileInput").addClass("d-none"));
        $(document).on("click", "#navigation [data-action='upload']", e => $("#fileInput").toggleClass("d-none"));
        $(document).on("click", "#navigation [data-action='persist']", e => this.persistData());
        $(document).on("click", "#navigation [data-action='cleanup']", e => this.cleanupData());
    };

    persistData() {
        window.localStorage.setItem("budgtVisualiserData", JSON.stringify(this.converter.data));
    }

    cleanupData() {
        window.localStorage.removeItem("budgtVisualiserData");
    }

    loadData() {
        let data = window.localStorage.getItem("budgtVisualiserData");

        if (data) {
            this.converter.data = JSON.parse(data, (key, value) => {
                if (key == "createdAt") {
                    return new Date(value)
                } else {
                    return value
                }
            });

            this.converter.displayData();
        }
    }
}