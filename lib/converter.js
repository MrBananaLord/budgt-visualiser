class Converter {
    constructor() {
        $(document).on("drop", "#fileInput", e => this.handleFileInput(e));
        $(document).on("dragover", "#fileInput", e => this.handleDragOver(e));

        this.data = {
            expenses: [],
            budgetEntries: []
        };
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleFileInput(e) {
        e.preventDefault();
        this.processedFiles = 0;
        this.filesQuantity = e.originalEvent.dataTransfer.files.length;
        this.updateProcessingProgress();

        Array.from(e.originalEvent.dataTransfer.files).forEach(file => {
            Papa.parse(file, {
                complete: (results, file) => {
                    let expenses = results.data.slice(
                        results.data.findIndex(e => e[0] == "All Expenses") + 2,
                        results.length
                    );
                    let createdAt = null;
                    expenses = expenses.filter(expense => expense[2] !== "");
                    expenses = expenses.map((expense, index) => {
                        createdAt = expense[0] === "" ? createdAt : this.dateFromString(expense[0]);

                        return {
                            createdAt: createdAt,
                            category: expense[1],
                            amount: parseFloat(expense[2]),
                            note: expense[3]
                        };
                    })
                    this.data.expenses = this.data.expenses.concat(expenses.filter(e => e.amount));

                    createdAt = new Date(results.data[2][0]);
                    let budgetEntries = results.data.slice(
                        results.data.findIndex(e => e[0] === "Budget Details") + 2,
                        results.data.findIndex(e => e[0] === "Used Categories") - 1
                    );
                    budgetEntries = budgetEntries.map((entry, index) => {
                        return {
                            createdAt: createdAt,
                            subject: entry[0],
                            type: entry[1],
                            recurring: entry[2],
                            amount: parseFloat(entry[3])
                        };
                    });
                    this.data.budgetEntries = this.data.budgetEntries.concat(budgetEntries);

                    this.processedFiles += 1;
                    this.updateProcessingProgress();
                }
            })
        });
    }

    dateFromString(string) {
        let chunks = string.split("-");
        return new Date([chunks[2], chunks[1], chunks[0]].join("-"));
    }

    updateProcessingProgress() {
        if (this.processedFiles == this.filesQuantity) {
            this.displayData();
            $("#fileInput").remove();
        }
    }

    groupBy(collection, callback) {
        return collection.reduce((result, element) => {
            let key = callback(element);

            if (!result.has(key)) {
                result.set(key, []);
            }

            result.get(key).push(element);

            return result;
        }, new Map());
    };

    displayData() {
        let groupedByYear = this.groupBy(this.data.expenses, e => e.createdAt.getFullYear()); // ORDER

        for (let year of Array.from(groupedByYear.keys()).sort((a, b) => b - a)) {
            let groupedByMonth = this.groupBy(groupedByYear.get(year), e => e.createdAt.getMonth()); // ORDER

            $("#expenses").append(`
                <div class="card" id="year_${year}">
                    <div class="card-header" id="heading_${year}">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_collapse" aria-expanded="false" aria-controls="year_${year}_collapse">
                        ${year}
                        </button>
                    </div>
                    <div id="year_${year}_collapse" class="collapse" aria-labelledby="heading_${year}">
                    </div>
                </div>
            `);

            for (let month of Array.from(groupedByMonth.keys()).sort((a, b) => b - a)) {
                let expenses = groupedByMonth.get(month).map(entry => `
                    <li class="list-group-item d-flex">
                        <span class="created-at mr-auto">${entry.createdAt.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'})}</span>
                        <span class="note">${entry.note}</span>
                        <span class="category">${entry.category}</span>
                        <span class="amount">${entry.amount}</span>
                    </li>
                `).join("");
                let budgetEntries = this.data.budgetEntries.filter(e => e.createdAt.getFullYear() === year && e.createdAt.getMonth() === month).map(entry => `
                    <li class="list-group-item d-flex">
                        <span class="subject mr-auto">${entry.subject}</span>
                        <span class="type">${entry.type}</span>
                        <span class="amount">${entry.amount}</span>
                    </li>
                `).join("");

                $(`#expenses #year_${year}_collapse`).append(`
                    <div class="card-header">
                            ${new Date(year, month).toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                    </div>
                    <div class="card-header">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_month_${month}_budget" aria-expanded="false" aria-controls="year_${year}_month_${month}_budget">
                            Budget
                        </button>
                    </div>
                    <ul id="year_${year}_month_${month}_budget" class="collapse list-group list-group-flush">
                        ${budgetEntries}
                    </ul>
                    <div class="card-header">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_month_${month}_expenses" aria-expanded="false" aria-controls="year_${year}_month_${month}_expenses">
                            Expenses
                        </button>
                    </div>
                    <ul id="year_${year}_month_${month}_expenses" class="collapse list-group list-group-flush">
                        ${expenses}
                    </ul>
                `);
            }
        }
    }
}