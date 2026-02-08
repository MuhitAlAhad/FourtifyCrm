using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddContactActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contact_activities",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    contact_id = table.Column<string>(type: "text", nullable: false),
                    activity_type = table.Column<string>(type: "text", nullable: false),
                    field_name = table.Column<string>(type: "text", nullable: false),
                    old_value = table.Column<string>(type: "text", nullable: false),
                    new_value = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    user_name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_activities", x => x.id);
                    table.ForeignKey(
                        name: "FK_contact_activities_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contact_activities_contact_id",
                table: "contact_activities",
                column: "contact_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contact_activities");
        }
    }
}
