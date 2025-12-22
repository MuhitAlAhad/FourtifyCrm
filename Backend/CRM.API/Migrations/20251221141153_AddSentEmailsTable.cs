using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSentEmailsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sent_emails",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    to_email = table.Column<string>(type: "text", nullable: false),
                    to_name = table.Column<string>(type: "text", nullable: false),
                    from_email = table.Column<string>(type: "text", nullable: false),
                    from_name = table.Column<string>(type: "text", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    html_body = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    resend_id = table.Column<string>(type: "text", nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    contact_id = table.Column<string>(type: "text", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    sent_by = table.Column<string>(type: "text", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sent_emails", x => x.id);
                    table.ForeignKey(
                        name: "FK_sent_emails_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_sent_emails_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_sent_emails_contact_id",
                table: "sent_emails",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_sent_emails_organisation_id",
                table: "sent_emails",
                column: "organisation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sent_emails");
        }
    }
}
