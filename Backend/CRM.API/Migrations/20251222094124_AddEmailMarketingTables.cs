using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailMarketingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "campaign_id",
                table: "sent_emails",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "clicked_at",
                table: "sent_emails",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "opened_at",
                table: "sent_emails",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "email_templates",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    html_body = table.Column<string>(type: "text", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "email_campaigns",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    html_body = table.Column<string>(type: "text", nullable: false),
                    template_id = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_recipients = table.Column<int>(type: "integer", nullable: false),
                    sent_count = table.Column<int>(type: "integer", nullable: false),
                    opened_count = table.Column<int>(type: "integer", nullable: false),
                    clicked_count = table.Column<int>(type: "integer", nullable: false),
                    bounced_count = table.Column<int>(type: "integer", nullable: false),
                    failed_count = table.Column<int>(type: "integer", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_campaigns", x => x.id);
                    table.ForeignKey(
                        name: "FK_email_campaigns_email_templates_template_id",
                        column: x => x.template_id,
                        principalTable: "email_templates",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_sent_emails_campaign_id",
                table: "sent_emails",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_campaigns_template_id",
                table: "email_campaigns",
                column: "template_id");

            migrationBuilder.AddForeignKey(
                name: "FK_sent_emails_email_campaigns_campaign_id",
                table: "sent_emails",
                column: "campaign_id",
                principalTable: "email_campaigns",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sent_emails_email_campaigns_campaign_id",
                table: "sent_emails");

            migrationBuilder.DropTable(
                name: "email_campaigns");

            migrationBuilder.DropTable(
                name: "email_templates");

            migrationBuilder.DropIndex(
                name: "IX_sent_emails_campaign_id",
                table: "sent_emails");

            migrationBuilder.DropColumn(
                name: "campaign_id",
                table: "sent_emails");

            migrationBuilder.DropColumn(
                name: "clicked_at",
                table: "sent_emails");

            migrationBuilder.DropColumn(
                name: "opened_at",
                table: "sent_emails");
        }
    }
}
