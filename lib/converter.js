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
                    this.data.expenses = this.data.expenses.concat(expenses);

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
        $("#fileInput").text(`Processed ${this.processedFiles} of ${this.filesQuantity}`);
        if (this.processedFiles == this.filesQuantity) {
            this.displayData();
        }
    }

    displayData() {
            $("body").html(`
          <div class="expenses">
              ${this.data.expenses.map(expense => `
                  <div class="expense">
                      <span class="created-at">${expense.createdAt}</span>
                      <span class="category">${expense.category}</span>
                      <span class="amount">${expense.amount}</span>
                      <span class="note">${expense.note}</span>
                  </div>
              `).join("")}
          </div>
          <div class="budget-entries">
              ${this.data.budgetEntries.map(entry => `
                  <div class="budget-entry">
                      <span class="created-at">${entry.createdAt}</span>
                      <span class="subject">${entry.subject}</span>
                      <span class="type">${entry.type}</span>
                      <span class="recurring">${entry.recurring}</span>
                      <span class="amount">${entry.amount}</span>
                  </div>
              `).join("")}
          </div>
      `);
    }
}