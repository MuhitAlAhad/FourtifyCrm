using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "abn",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "deed_end_date",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "deed_start_date",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "postcode",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "state",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "supplier_name",
                table: "organisations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "abn",
                table: "organisations");

            migrationBuilder.DropColumn(
                name: "deed_end_date",
                table: "organisations");

            migrationBuilder.DropColumn(
                name: "deed_start_date",
                table: "organisations");

            migrationBuilder.DropColumn(
                name: "postcode",
                table: "organisations");

            migrationBuilder.DropColumn(
                name: "state",
                table: "organisations");

            migrationBuilder.DropColumn(
                name: "supplier_name",
                table: "organisations");
        }
    }
}
