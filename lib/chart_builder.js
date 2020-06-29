class ChartBuilder {
    budgetOverview(data) {
        if ($("#budgetOverview").length) { return };

        $("#budgetCard").append(`<div class="chart-container"><canvas class="chart" id="budgetOverview"></canvas></div>`);

        let data = data;
        let monthly = data.byMonth;
        let monthLabels = Object.keys(monthly);
        let expenses = Object.keys(monthly).map(key => monthly[key]["expenses"].reduce((result, expense) => result + expense.amount, 0.0));

        let income = Object.keys(monthly).map(key => monthly[key]["budget"].reduce((result, expense) => {
            if (expense.type === "Income") { result += expense.amount }
            return result;
        }, 0.0));
        let budgetExpenses = Object.keys(monthly).map(key => monthly[key]["budget"].reduce((result, expense) => {
            if (expense.type === "Expense") { result -= expense.amount }
            return result;
        }, 0.0));

        new Chart($("#budgetOverview"), {
            type: 'line',
            data: {
                labels: monthLabels,
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
                maintainAspectRatio: false,
                responsive: true
            }
        });
    }

    budgetSubjects() {
        if ($("#budgetSubjects").length) { return };

        $("#budgetCard").append(`<div class="chart-container"><canvas class="chart" id="budgetSubjects"></canvas></div>`);

        let data = data;
        let monthly = data.byMonth;
        let monthLabels = Object.keys(monthly);
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

        new Chart($("#budgetSubjects"), {
            type: 'bar',
            data: {
                labels: monthLabels,
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
                maintainAspectRatio: false,
                responsive: true
            }
        });
    }

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
}