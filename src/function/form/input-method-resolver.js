/**
 * Resolve the UI input method from semantic field name.
 * Protected/system fields are never rendered as normal admin inputs.
 */
const exact={profile_image_url:"image-picker",icon_url:"image-picker",media_url:"file-picker-url",page_slug:"slug-input",seo_slug:"slug-input",html_content:"rich-text-editor",published_at:"date-time-picker",visited_at:"date-time-picker"};
const rules=[
["image-picker",/^(profile_image_url|avatar_url|cover_image_url|image_url|icon_url)$/i],
["file-picker-url",/(storage_path|file_url|attachment_url|document_url|backup_location|media_url)$/i],
["email-input",/(^|_)email$/i],["phone-input",/(^|_)(phone|mobile|telephone)(_|$)/i],
["slug-input",/(^|_)slug$/i],["rich-text-editor",/(html_content|rich_text|formatted_content)$/i],
["textarea",/(description|bio|caption|summary|notes|address)$/i],
["date-time-picker",/(published_at|visited_at|scheduled_at|timestamp|_date$|_datetime$)/i],
["switch-toggle",/^(is_|has_|can_|enabled|visible|active)/i],
["number-input",/(^|_)(order|display_order|size|width|height|count|limit|position)$/i],
["url-input",/(^|_)(url|website|canonical_url|link)$/i],
["select-dropdown",/(status|type|method|account_type|directive|domain)$/i],
["multi-select",/(languages|permissions|roles)$/i],
["relation-selector",/(^|_)(profile_id|role_id|permission_id|album_id|post_id|media_id|created_by|updated_by|assigned_by)$/i],
["structured-json-editor",/(seo_data|social_links|other_links|setting_value|action_data|metadata|backup_metadata)$/i]];
const system=/(^|_)(created_at|updated_at|assigned_at|created_by|updated_by|assigned_by|retention_expires_at|.*_id)$/i;
export function resolveFieldInputMethod(field,options={}){const name=String(field?.name??field??"").trim();if(!name)return"text-input";if(options.readOnly||options.systemControlled||system.test(name))return"system";if(options.override)return options.override;if(exact[name])return exact[name];const hit=rules.find(([,r])=>r.test(name));if(hit)return hit[0];const type=String(field?.dataType??field?.type??"").toLowerCase();if(["boolean","bool"].includes(type))return"switch-toggle";if(["integer","bigint","numeric","decimal","real","double precision"].includes(type))return"number-input";if(["date","timestamp","timestamptz","datetime"].includes(type))return"date-time-picker";if(["json","jsonb"].includes(type))return"structured-json-editor";return"text-input";}
