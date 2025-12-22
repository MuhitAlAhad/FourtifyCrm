using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class ImproveSchemaV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                table: "activities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "outcome",
                table: "activities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "user_id",
                table: "activities",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "crm_tasks",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    priority = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: true),
                    contact_id = table.Column<string>(type: "text", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    assigned_to = table.Column<string>(type: "text", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_crm_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_crm_tasks_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_crm_tasks_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_crm_tasks_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_crm_tasks_users_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notes",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: true),
                    contact_id = table.Column<string>(type: "text", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    is_pinned = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notes", x => x.id);
                    table.ForeignKey(
                        name: "FK_notes_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_notes_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_notes_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "proposals",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    valid_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_proposals", x => x.id);
                    table.ForeignKey(
                        name: "FK_proposals_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_proposals_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "attachments",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    file_path = table.Column<string>(type: "text", nullable: false),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: true),
                    proposal_id = table.Column<string>(type: "text", nullable: true),
                    organisation_id = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_attachments_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_attachments_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalTable: "organisations",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_attachments_proposals_proposal_id",
                        column: x => x.proposal_id,
                        principalTable: "proposals",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_organisations_abn",
                table: "organisations",
                column: "abn");

            migrationBuilder.CreateIndex(
                name: "IX_organisations_name",
                table: "organisations",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_organisations_state",
                table: "organisations",
                column: "state");

            migrationBuilder.CreateIndex(
                name: "IX_leads_owner",
                table: "leads",
                column: "owner");

            migrationBuilder.CreateIndex(
                name: "IX_leads_priority",
                table: "leads",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "IX_leads_stage",
                table: "leads",
                column: "stage");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_email",
                table: "contacts",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_first_name_last_name",
                table: "contacts",
                columns: new[] { "first_name", "last_name" });

            migrationBuilder.CreateIndex(
                name: "IX_activities_activity_date",
                table: "activities",
                column: "activity_date");

            migrationBuilder.CreateIndex(
                name: "IX_activities_contact_id",
                table: "activities",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_activities_lead_id",
                table: "activities",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "IX_activities_organisation_id",
                table: "activities",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "IX_activities_type",
                table: "activities",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_activities_user_id",
                table: "activities",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_attachments_lead_id",
                table: "attachments",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "IX_attachments_organisation_id",
                table: "attachments",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "IX_attachments_proposal_id",
                table: "attachments",
                column: "proposal_id");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_assigned_to",
                table: "crm_tasks",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_contact_id",
                table: "crm_tasks",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_due_date",
                table: "crm_tasks",
                column: "due_date");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_lead_id",
                table: "crm_tasks",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_organisation_id",
                table: "crm_tasks",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_priority",
                table: "crm_tasks",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "IX_crm_tasks_status",
                table: "crm_tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_notes_contact_id",
                table: "notes",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_notes_is_pinned",
                table: "notes",
                column: "is_pinned");

            migrationBuilder.CreateIndex(
                name: "IX_notes_lead_id",
                table: "notes",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "IX_notes_organisation_id",
                table: "notes",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_lead_id",
                table: "proposals",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_organisation_id",
                table: "proposals",
                column: "organisation_id");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_status",
                table: "proposals",
                column: "status");

            migrationBuilder.AddForeignKey(
                name: "FK_activities_contacts_contact_id",
                table: "activities",
                column: "contact_id",
                principalTable: "contacts",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_activities_leads_lead_id",
                table: "activities",
                column: "lead_id",
                principalTable: "leads",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_activities_organisations_organisation_id",
                table: "activities",
                column: "organisation_id",
                principalTable: "organisations",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_activities_users_user_id",
                table: "activities",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_activities_contacts_contact_id",
                table: "activities");

            migrationBuilder.DropForeignKey(
                name: "FK_activities_leads_lead_id",
                table: "activities");

            migrationBuilder.DropForeignKey(
                name: "FK_activities_organisations_organisation_id",
                table: "activities");

            migrationBuilder.DropForeignKey(
                name: "FK_activities_users_user_id",
                table: "activities");

            migrationBuilder.DropTable(
                name: "attachments");

            migrationBuilder.DropTable(
                name: "crm_tasks");

            migrationBuilder.DropTable(
                name: "notes");

            migrationBuilder.DropTable(
                name: "proposals");

            migrationBuilder.DropIndex(
                name: "IX_organisations_abn",
                table: "organisations");

            migrationBuilder.DropIndex(
                name: "IX_organisations_name",
                table: "organisations");

            migrationBuilder.DropIndex(
                name: "IX_organisations_state",
                table: "organisations");

            migrationBuilder.DropIndex(
                name: "IX_leads_owner",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "IX_leads_priority",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "IX_leads_stage",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "IX_contacts_email",
                table: "contacts");

            migrationBuilder.DropIndex(
                name: "IX_contacts_first_name_last_name",
                table: "contacts");

            migrationBuilder.DropIndex(
                name: "IX_activities_activity_date",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_activities_contact_id",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_activities_lead_id",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_activities_organisation_id",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_activities_type",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_activities_user_id",
                table: "activities");

            migrationBuilder.DropColumn(
                name: "duration_minutes",
                table: "activities");

            migrationBuilder.DropColumn(
                name: "outcome",
                table: "activities");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "activities");
        }
    }
}
