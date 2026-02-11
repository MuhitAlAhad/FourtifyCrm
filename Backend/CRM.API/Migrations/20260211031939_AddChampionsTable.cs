using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddChampionsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "champions",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    organization_name = table.Column<string>(type: "text", nullable: false),
                    address = table.Column<string>(type: "text", nullable: false),
                    allocated_sale = table.Column<int>(type: "integer", nullable: false),
                    active_clients = table.Column<int>(type: "integer", nullable: false),
                    conversion_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    performance_score = table.Column<decimal>(type: "numeric", nullable: false),
                    last_activity = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_champions", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_payments_payment_date",
                table: "payments",
                column: "payment_date");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_invoice_number",
                table: "invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_invoices_status",
                table: "invoices",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_clients_status",
                table: "clients",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_champions_email",
                table: "champions",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "IX_champions_name",
                table: "champions",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_champions_organization_name",
                table: "champions",
                column: "organization_name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "champions");

            migrationBuilder.DropIndex(
                name: "IX_payments_payment_date",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_invoices_invoice_number",
                table: "invoices");

            migrationBuilder.DropIndex(
                name: "IX_invoices_status",
                table: "invoices");

            migrationBuilder.DropIndex(
                name: "IX_clients_status",
                table: "clients");
        }
    }
}
