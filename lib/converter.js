class Converter {
    constructor() {
        $(document).on("drop", "#fileInput", e => this.handleFileInput(e));
        $(document).on("dragover", "#fileInput", e => this.handleDragOver(e));

        this.data = {
            expenses: [],
            budget: [],
            byMonth: {},
            years: []
        };
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleFileInput(e) {
        e.preventDefault();
        this.processedFiles = 0;
        this.filesQuantity = e.originalEvent.dataTransfer.files.length;

        $("#fileInput").addClass("d-none");
        $("#spinner").removeClass("d-none");

        Array.from(e.originalEvent.dataTransfer.files).forEach(file => {
            Papa.parse(file, {
                complete: (results, file) => {
                    let createdAt = new Date(results.data[2][0]);
                    let year = createdAt.getFullYear();
                    let month = createdAt.getMonth();

                    let budget = results.data.slice(
                        results.data.findIndex(e => e[0] === "Budget Details") + 2,
                        results.data.findIndex(e => e[0] === "Used Categories") - 1
                    );
                    budget = budget.map((entry, index) => {
                        return {
                            createdAt: createdAt,
                            subject: entry[0],
                            type: entry[1],
                            recurring: entry[2],
                            amount: parseFloat(entry[3])
                        };
                    });

                    let expenses = results.data.slice(
                        results.data.findIndex(e => e[0] == "All Expenses") + 2,
                        results.length
                    );
                    createdAt = null;
                    expenses = expenses.map((expense, index) => {
                        createdAt = expense[0] === "" ? createdAt : this.dateFromString(expense[0]);

                        return {
                            createdAt: createdAt,
                            category: expense[1],
                            amount: parseFloat(expense[2]),
                            note: expense[3]
                        };
                    })
                    expenses = expenses.filter(e => e.amount);

                    this.data.budget = this.data.budget.concat(budget);
                    this.data.expenses = this.data.expenses.concat(expenses);
                    if (!this.data.years.includes(year)) { this.data.years.push(year) }
                    this.data.byMonth[`${year}-${month}`] = {
                        budget: budget,
                        expenses: expenses
                    };

                    this.processedFiles += 1;

                    this.updateProcessingProgress();
                }
            })
        });
    }

    updateProcessingProgress() {
        if (this.processedFiles == this.filesQuantity) {
            $("#spinner").addClass("d-none");
            this.displayData();
        }
    }

    dateFromString(string) {
        let chunks = string.split("-");
        return new Date([chunks[2], chunks[1], chunks[0]].join("-"));
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

    get colors() {
        return ["#01b9db",
            "#e2000b",
            "#41ff6d",
            "#642fdb",
            "#feff27",
            "#6e00a7",
            "#22bd00",
            "#ea0097",
            "#83ce00",
            "#257bff",
            "#a6ff79",
            "#710083",
            "#01e9a0",
            "#ee0044",
            "#01fbf5",
            "#ff7326",
            "#007ac6",
            "#ffd664",
            "#14004d",
            "#dcff91",
            "#c784ff",
            "#729400",
            "#a391ff",
            "#01983f",
            "#9f0060",
            "#8fffe5",
            "#6e005e",
            "#006409",
            "#ff6067",
            "#01b9b1",
            "#920019",
            "#8fbfff",
            "#b84700",
            "#016591",
            "#ffad56",
            "#003160",
            "#a69200",
            "#dbbfff",
            "#1e3c00",
            "#e2ebff",
            "#560007",
            "#007c6c",
            "#b47200",
            "#001a0c",
            "#ffa87c",
            "#004b41",
            "#ffbfbd",
            "#2b1800",
            "#894200",
            "#483400"
        ];
    }

    displayData() {
        let monthly = this.data.byMonth;
        let labels = Object.keys(monthly);
        let expenses = Object.keys(monthly).map(key => monthly[key]["expenses"].reduce((result, expense) => result + expense.amount, 0.0));

        let income = Object.keys(monthly).map(key => monthly[key]["budget"].reduce((result, expense) => {
            if (expense.type === "Income") { result += expense.amount }
            return result;
        }, 0.0));
        let budgetExpenses = Object.keys(monthly).map(key => monthly[key]["budget"].reduce((result, expense) => {
            if (expense.type === "Expense") { result -= expense.amount }
            return result;
        }, 0.0));

        new Chart($("#chart"), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                        label: "Expenses",
                        data: expenses,
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

        let categories = this.data.budget.map(e => e.subject).filter((v, i, a) => a.indexOf(v) == i);
        let datasets = categories.map((category, index) => {
            let data = Object.keys(monthly).map(key => monthly[key]["budget"].reduce((result, expense) => {
                if (expense.subject === category) { result += expense.amount }
                return result;
            }, 0.0));

            return {
                label: category,
                data: data,
                backgroundColor: this.colors[index % this.colors.length]
            };
        })

        new Chart($("#categoriesChart"), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    xAxes: [{
                        display: true,
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Value'
                        }
                    }]
                },
                maintainAspectRatio: false
            }
        });

        $("#expenses").empty();
        for (let year of this.data.years.sort((a, b) => b - a)) {
            $("#expenses").append(`
                <div class="card" id="year_${year}">
                    <div class="card-header" id="heading_${year}">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_collapse" aria-expanded="false" aria-controls="year_${year}_collapse">
                            <h3>${year}</h3>
                        </button>
                    </div>
                    <div id="year_${year}_collapse" class="collapse" aria-labelledby="heading_${year}">
                    </div>
                </div>
            `);

            for (let month of[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
                if (!this.data.byMonth[`${year}-${month}`]) { continue }

                let expenses = this.data.byMonth[`${year}-${month}`]["expenses"].map(entry => `
                    <li class="list-group-item d-flex border-right">
                        <span class="created-at">${entry.createdAt.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'})}</span>
                        <span class="note mr-auto">${entry.note}</span>
                        <span class="category">${entry.category}</span>
                        <span class="amount">${entry.amount}</span>
                    </li>
                `).join("");
                let budget = this.data.byMonth[`${year}-${month}`]["budget"].map(entry => `
                    <li class="list-group-item d-flex">
                        <span class="subject mr-auto">${entry.subject}</span>
                        <span class="type">${entry.type}</span>
                        <span class="amount">${entry.amount}</span>
                    </li>
                `).join("");

                $(`#expenses #year_${year}_collapse`).append(`
                    <div class="card-header">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target=".year_${year}_month_${month}" aria-expanded="false" aria-controls="year_${year}_month_${month}_expenses year_${year}_month_${month}_budget">
                            <h4>${new Date(year, month).toLocaleDateString('default', { year: 'numeric', month: 'long' })}</h4>
                        </button>
                    </div>
                    <div class="row">
                        <div class="col-md border-right">
                            <div class="card-header">
                                <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_month_${month}_budget" aria-expanded="false" aria-controls="year_${year}_month_${month}_budget">
                                    <h5>Budget</h5>
                                </button>
                            </div>
                            <ul id="year_${year}_month_${month}_budget" class="collapse list-group list-group-flush year_${year}_month_${month}">
                                ${budget}
                            </ul>
                        </div>
                        <div class="col-md">
                            <div class="card-header">
                                <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#year_${year}_month_${month}_expenses" aria-expanded="false" aria-controls="year_${year}_month_${month}_expenses">
                                    <h5>Expenses</h5>
                                </button>
                            </div>
                            <ul id="year_${year}_month_${month}_expenses" class="collapse list-group list-group-flush year_${year}_month_${month}">
                                ${expenses}
                            </ul>
                        </div>
                    </div>
                `);
            }
        }
    }
}