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
        let monthly = this.groupBy(this.data.expenses, e => e.createdAt.toLocaleDateString('default', { year: 'numeric', month: 'long' }));
        let labels = Array.from(monthly.keys());
        let data = Array.from(monthly.keys()).map(key => monthly.get(key).reduce((result, expense) => result + expense.amount, 0.0));

        let budgetMonthly = this.groupBy(this.data.budgetEntries, e => e.createdAt.toLocaleDateString('default', { year: 'numeric', month: 'long' }));
        let income = Array.from(monthly.keys()).map(key => budgetMonthly.get(key).reduce((result, expense) => {
            if (expense.type === "Income") { result += expense.amount }
            return result;
        }, 0.0));
        let budgetExpenses = Array.from(monthly.keys()).map(key => budgetMonthly.get(key).reduce((result, expense) => {
            if (expense.type === "Expense") { result -= expense.amount }
            return result;
        }, 0.0));

        new Chart($("#chart"), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                        label: "Expenses",
                        data: data,
                        backgroundColor: "rgba(255, 0, 0, 0.6)"
                    },
                    {
                        label: "Budget Income",
                        data: income,
                        backgroundColor: "rgba(0, 255, 0, 0.6)"
                    },
                    {
                        label: "Budget Expenses",
                        data: budgetExpenses,
                        backgroundColor: "rgba(0, 0, 255, 0.8)"
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Value'
                        }
                    }]
                },
                maintainAspectRatio: false
            }
        });

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