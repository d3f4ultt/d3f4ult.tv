import { Client, GatewayIntentBits, GuildMember } from 'discord.js';

// Discord bot client for role verification
let discordClient: Client | null = null;

/**
 * Initialize Discord bot client
 */
export async function initDiscordBot(): Promise<void> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('[Discord] Bot token not configured, role verification disabled');
    return;
  }

  try {
    discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
    });

    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
    console.log('[Discord] Bot client initialized successfully');
  } catch (error) {
    console.error('[Discord] Failed to initialize bot:', error);
    discordClient = null;
  }
}

/**
 * Check if a Discord user has a specific role in a guild
 */
export async function checkUserRole(
  discordUserId: string,
  guildId: string,
  roleId: string
): Promise<boolean> {
  if (!discordClient) {
    console.warn('[Discord] Bot not initialized, cannot verify role');
    return false;
  }

  try {
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) {
      console.error('[Discord] Guild not found:', guildId);
      return false;
    }

    const member: GuildMember = await guild.members.fetch(discordUserId);
    if (!member) {
      console.error('[Discord] Member not found:', discordUserId);
      return false;
    }

    const hasRole = member.roles.cache.has(roleId);
    console.log(`[Discord] User ${discordUserId} has role ${roleId}: ${hasRole}`);

    return hasRole;
  } catch (error) {
    console.error('[Discord] Error checking user role:', error);
    return false;
  }
}

/**
 * Get all roles for a Discord user in a specific guild
 */
export async function getUserRoles(
  discordUserId: string,
  guildId: string
): Promise<Array<{ guild_id: string; role_id: string; role_name: string }>> {
  if (!discordClient) {
    console.warn('[Discord] Bot not initialized, cannot fetch roles');
    return [];
  }

  try {
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) {
      console.error('[Discord] Guild not found:', guildId);
      return [];
    }

    const member: GuildMember = await guild.members.fetch(discordUserId);
    if (!member) {
      console.error('[Discord] Member not found:', discordUserId);
      return [];
    }

    const roles = member.roles.cache
      .filter(role => role.id !== guildId) // Exclude @everyone role
      .map(role => ({
        guild_id: guildId,
        role_id: role.id,
        role_name: role.name
      }));

    console.log(`[Discord] User ${discordUserId} has ${roles.length} roles in guild ${guildId}`);

    return roles;
  } catch (error) {
    console.error('[Discord] Error fetching user roles:', error);
    return [];
  }
}

/**
 * Check if user has the special badge role
 */
export async function hasSpecialBadge(discordUserId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_SPECIAL_ROLE_ID;

  if (!guildId || !roleId) {
    console.warn('[Discord] Guild ID or special role ID not configured');
    return false;
  }

  return await checkUserRole(discordUserId, guildId, roleId);
}

// Initialize Discord bot on module load
initDiscordBot().catch(err => {
  console.error('[Discord] Failed to start bot:', err);
});
