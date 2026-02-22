#!/bin/bash
export PATH="$HOME/.cargo/bin:$PATH"
yes | avm use 0.29.0
cd /mnt/d/AETERNA/programs/aeterna
echo "== BUILDING AETERNA =="
anchor build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi
echo "== SYNCING KEYS =="
anchor keys sync
echo "== DEPLOYING AETERNA =="
anchor deploy --provider.cluster devnet
