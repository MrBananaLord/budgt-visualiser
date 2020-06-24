class Controller {
    constructor(converter) {
        this.converter = converter;

        $(document).on("click", "#fileInput button.close", e => $("#fileInput").addClass("d-none"));
        $(document).on("click", "#navigation [data-action='upload']", e => $("#fileInput").toggleClass("d-none"));
    };
}