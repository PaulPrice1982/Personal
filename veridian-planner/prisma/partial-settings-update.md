# Schema update note (17/10/2026)

In `SettingsHistory`, replace the line

    lateCancellationWorkingDays Int @default(2)

with

    // Cancellation charge tiers (consultancy agreement schedule 1 s8.4), JSON
    // [{minNoticeDays, chargeFraction}]: under 14 days 100%, 14-44 75%,
    // 45-89 50%, 90+ free.
    cancellationTiersJson String @default("[{\"minNoticeDays\":90,\"chargeFraction\":0},{\"minNoticeDays\":45,\"chargeFraction\":0.5},{\"minNoticeDays\":14,\"chargeFraction\":0.75},{\"minNoticeDays\":0,\"chargeFraction\":1}]")

Everything else in `schema.prisma` stands.
