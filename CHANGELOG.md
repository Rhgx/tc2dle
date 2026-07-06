# TC2DLE Changelog

## v0.4.4 - 2026-07-06

### Maps

- Updated the map images for `pl_calamity`, `pl_manufacturing`, `koth_sawmill` and, `ad_tropical`.

## v0.4.3 - 2026-06-29

### Maps

- Refreshed map pictures from the TC2 wiki.
- Removed a duplicate Harvest map preview from the map answer pool.

## v0.4.2 - 2026-06-29

### Update log

- Added a small page-change animation to the update log.
- Reduced layout jumping when moving between update log pages.

## v0.4.1 - 2026-06-28

### Site

- Added an in-app update log so players can see recent TC2DLE changes from the footer.

## v0.4.0 - 2026-06-28

### Cosmetic mode

- Cosmetic picture rotation now uses a broad whole-degree range instead of only quarter turns.
  - The hidden picture can land anywhere from 30 to 330 degrees.
  - The rotation is still deterministic per daily cosmetic, so everyone sees the same puzzle state.

## v0.3.2 - 2026-06-23

### Content

- Refreshed weapon, map, and cosmetic content for TC2's [Just Enough Slots](https://typicalcolors2.fandom.com/wiki/Just_Enough_Slots) update.

### Maps

- Cleaned up duplicate-looking map previews.
- The map answer pool should feel less repetitive when different entries used the same or nearly identical image.

## v0.3.1 - 2026-06-16

### Daily answer selection

- Daily picks now avoid repeating yesterday's answer when the answer pool has enough items.
- The recent-pick protection window was expanded to 30 days.
  - This makes the daily cycle feel less streaky.
  - The picker still stays deterministic, so all players share the same answer each day.

## v0.3.0 - 2026-05-15

### Loading and images

- Images should load faster and more reliably across the site.
- Daily answer images are prioritized so the main puzzle feels snappier after opening a page.

### Weapon clues

- Weapon clue labels were cleaned up for consistency.
- Ammo-related clues were renamed and normalized so guess results are easier to read.
- Weapon comparison data became more reliable for role, slot, type, and stat clues.

## v0.2.1 - 2026-05-10

### Reveal polish

- Map image hints now zoom toward a better crop point.
- Map and cosmetic solved reveals feel smoother and less abrupt.
- Old saved guesses are cleaned up more sensibly, reducing confusing stale state after daily answer changes.

## v0.2.0 - 2026-05-06

### Cosmetics mode

- Added the daily cosmetic guessing game.
- Cosmetic answers include image, class usage, and slot data.
- Cosmetic clues reveal in stages:
  - rotation correction,
  - color reveal,
  - class usage.

### Map pool

- Added a dedicated map guessing mode.
- Excluded unsupported or awkward map modes such as Infection and Prop Hunt from the guessing pool.
- Reduced duplicate map thumbnails that pointed at the same visual preview.

## v0.1.0 - 2026-05-03

### Launch

- Launched TC2DLE as a daily Typical Colors 2 guessing game focused on weapons.
- Added global daily answers that reset at UTC midnight.

### Weapon game

- Added weapon guessing with clue comparison across role, slot, type, stats, and image.
- Weapon images load locally for a more stable play experience.
- Weapon icons were given stronger presentation against the dark game board.
- Excluded community-only weapons from the answer pool.

### Interface polish

- Tuned desktop board sizing and weapon icon scaling.
- Stabilized the footer countdown and compacted the attribution area.
- Refined result-cell accessibility and comparison legend behavior.
- Added lazy-loaded celebration confetti for solved games.
