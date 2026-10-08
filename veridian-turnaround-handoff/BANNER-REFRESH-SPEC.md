# Build spec: banner photography refresh

Replace the hero banner photographs on seven pages with the new set the
owner has approved. Guarded one-time transform; the operator's own choices
always win; the old photographs stay in the media library.

## Mechanics

1. Download the seven images from the URLs below (they expire within about
   90 minutes of this spec's commit time, so download first). They are PNG
   at 2560x1440; convert each to JPEG, max 1920px wide, under 300 KB,
   saved into `seed-media/` with the filenames given.
2. Add them to `SEED_MEDIA` in `src/images.js` with new ids (prefix
   `med_seed2_`), page left empty (''), and the alt text given below, so
   they are delivered to the media library once like any other seed image.
3. Add a one-time guarded transform (`transform:banner-refresh-v1`) in
   `src/store.js`: for each page listed, if the page's hero `mediaId` still
   equals the ORIGINAL seed media id for that page (the operator has not
   assigned a different image), point it at the new media id. If the
   operator changed it, leave the page untouched. Old media entries are
   not deleted.
4. Self-test: new checks that the swap applied on an untouched document,
   that an operator-assigned hero is not overwritten, and that deletion of
   a new image is respected. Full suite green.

## The seven banners

| File | Page | Replaces | Alt text |
| --- | --- | --- | --- |
| banner2-workshop.jpg | services | med_seed_workshop | Three people at the whiteboard, working the plan through |
| banner2-contracts-desk.jpg | contract-monetisation | med_seed_contracts_desk | A signed contract on the desk, the library behind it |
| banner2-pipeline-review.jpg | revenue-operations | med_seed_pipeline_review | The boardroom screen at dusk, the pipeline up |
| banner2-boardroom.jpg | advisory | med_seed_boardroom | Two advisers at the boardroom window, the city below |
| banner2-method.jpg | work | med_seed_method | The revenue engine, drawn out on the whiteboard |
| banner2-card.jpg | about | med_seed_card | The Veridian card on the desk |
| banner2-conversation.jpg | contact | med_seed_conversation | A conversation by the window, coffee on the table |

## Download URLs

banner2-workshop.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/e1X9z6cAJ2s1VpBlq1AU/kvEtojBWr7KI62acRw56/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213648Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=095c12308eccbd692e7ec1780752604ceed7bb63ba5d8f9d090b192cdbd8bc2676a84a19744551b9601e590b47fe5f75304994de786d641b33c96bb8c48e840d36bcfbc015ef4dd4c4f707bccb0f74d1bf092833d85d0bbcf318102c24464f9f68691b2f7c5e3abf3e48f484faf5927ad0f44971803bef9e231ee0db7bac91f0da6179ed428fcb3df37400f9f99073e4806008e77c77cb80872ec4a2493dbc21c5ffa836367c4f5ee6463513e447c1de948678193aa7e4cc59a4e858f7df3a30cc648a082b2919e65fa91819e32e62fa16338f7913f00698dcfab1efd7515e7f9b65c0faecc96ece0395f6e7eb95423e6a6ac9013f9a494c97e9105e81aeb042

banner2-contracts-desk.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/hQbDhg83kBgqNpyFWaMy/EuRjk5ANI4da6nFsJFOp/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213642Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=0818ceed90b62bd52cf50449d222dcde823956420c0e4f98046414f7099ca9222af5418901864006fefbee44e75287f06c18bdb112b9b5eb259b1ec2a615b28837e511e678c990f22e533c8b043ade6c15ab2a4a68a9b2f5b724464ca87f919181f00f48b86f0d93451f90d30d95b3e2a99e257f82d511fadf68ee2e29bfde28296ce2a69101a5f9525286d76302cb9174c853d36dbb5e722948cec429c205081aadafa061e68a41d53d2e5f9130a501ed658b1798fbc0889a61e1db0dacd12ef5cbe0f09e1b7e26577cfb2cba8b0d9bac34243cb438b82034fbbf1f78e463f8284bb20ed49548b0e78fffb3861f2f100f3c9866b3ce8b78e5b4344d97184387

banner2-pipeline-review.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/33aCvRuv3Eu8pbhVfdfC/BZmljXkvTNL6LkVoMZgU/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213647Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=9dbc642cbd453dd6f264abbcfde6ccca97bef396854c903cd71f1051d0391bb957e99a301550206473ee27040e6fa48c15274f616e2c399505d5f13cd08f3bb8d9672c5406af1ce0a71639a8cfdfab3506cb046eda2d415b477e5105be1d6161f8161574a5edbed929683abc3406390e047fd5c98ae2d2de43c9fb8a2dfdf82e9748bae8d129e1c833884b3ab92efa909ab2e93e1a62d05d33bdc375b8652c3d04cec499ad6a194772c723ed60e56e938345fb944577593d0ca2d414d867ec2fb1a2c97971504bcbfdf10ae664702bcffd02fd23c332d07c02795b152c119e97675eb75e8ea0aed927a639da1e42f6474c5bae7f2990badf0efdd944b18445f6

banner2-boardroom.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/NfAYf0Jf9eFXp2TCOfBa/ITR0TDpn3mX6P96uKfPl/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213648Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=5cdacc327ff74ebecdf6a9c0760e379f41ddc19a7bb213438f0ca9a7dc7296e517cd79786ea722d9f81aa87ddea2f411f40a5aa7c1e25a1369678331e26af27b27c072c3996fc112b86a17b8de547b354a2a428761a037ae9c8eea7a6ac1cf83bd578c9b4bd43455cd41e9b589b2d48107d7eb2751651e749b62bdf7581abd44e4596fa9d6e8cd2143feacb7c8617281ebc168891e2a46ded6ef10bdd22847e2e9fa83a74e30b41f4b4035bb7a30248a0643274ae1952c43eb91742a3564b9a1673e83e9046d4bf3e0d72a833fdf5f36f3ef14132000a7cf1c65dd52a4120e341aafe139752ab9ac354ab5b53e565ceb04bdbeee99a09769df986fdf1eebf6ac

banner2-method.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/tpp9m9s9GXu0O5GF7Qf9/yzGGZBjYWONr0xj3GZJJ/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213642Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=41b6e98f777e1203cd5c2cc475f21d8f0ecc88c47a30cbe377c931a9e1391fbd2e1da4769a44ca1445577cf93491b96e485c8924d08d21cc45cc43e68222ab6b7855b580146ed3821feb8ae2e98bfa03beba5c7ec3236a198dfd3830310600899d535aebee79d47e068fd0b1765333425e414d0a4e576311c7be276ef9e4ce5d839d69590f3e502ff0b32d48b41567af98a21e60d41394748c6c709388ea074d7e2304cabdc100ae0044b17032b2b90effd9e4cc110fa2a9a4cea4a1a1f07b08e21c3958ce2deefa3f3c65de15fbdae3aa75bfd0ce6aec28f149b3d82caa0532232fc9298365d67731ac9d34fc0ee0074a9ea89e96b007860b123904dc975615

banner2-card.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/KHjsonKlAwMLpQSOz0CB/ttQRtuUUTkbQ772HV5X7/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213649Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=9176f319f91e971c8accf1db97317185f7608034d052844bb3959898aef810f8bb5c52e1273e945b52cbfd3608bc51be66b26546f51a29e63060a096214a9b65d7606ac6a8052de278a74683cd758023ebc17ef33b10aa2af17c578c280a3568b495dadccf4aca8566b1c204e546404f237c40decf9738ff33d7085494a15ce668e53e2ef9390a8ad66be3ac1f9f9ea930a6921215ef1402baffc57a54f8fe866eb81de5d2a1fcff02c2cc6c4606cad9e95b7e1d146bcb41c89ee26043920009d8931ac431536fa60a67da7d7a967c9f412e756a9194e51acbffe0a93130de0257f2f1caa064019878445c683844ea6c05bfba45a57a566f7b11b70fc9608946

banner2-conversation.jpg:
https://storage.googleapis.com/xi-backend/database/workspace/9af3bfeb4b6c47c486b48e2fadff5a18/content_generation/q9D1uqWGQ75sK43TNYts/3SbU2JSqJR5oWzHN16Rn/content.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261008%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261008T213643Z&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=0b0dec7e3ca1e1cca34b3122c95ebb155b24d5df79a412b64e743527ebc24ea44028da886a7ec04e6338fa6d65e8bf779642feb50b76a3496c9dbe3c277815f47f14ef3d60cb4c1286f1b3bb7246f08056a293b437b96e9d71d3d946db1e566ea803a15e04b9fc99b3edf6f546328723755ee25502c1a552cfc36e8cb78be863ff9b1ab8a88ade8f04d6b806b089e663f0676cb65aef9738b2888bbec67a76ac7796a1220bf7d0ca62851ac11a64377003e52508eaf6e3b6af065dc749403245e9b895dee3e9eb6fd841fc2ec8dd5537a92d4c08cbffea3a999ba700c8a80a26a25c9ee18d8c78b030f3b9f30bf28180d10dc998a04003624858cce2bf7ecadc
