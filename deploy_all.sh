#!/bin/bash
export PATH="$HOME/.cargo/bin:$PATH"

echo "----------------------------------------"
echo "        DEPLOYING WORLD PROGRAM         "
echo "----------------------------------------"
cd /mnt/d/AETERNA/programs/world
echo "1/4: Initial Build (Generating Keypair)"
anchor build
if [ $? -ne 0 ]; then echo "Build failed!"; exit 1; fi

echo "2/4: Syncing Keys"
anchor keys sync

echo "3/4: Final Build (Baking new ID into .so)"
anchor build

echo "4/4: Deploying to Devnet"
anchor deploy --provider.cluster devnet
if [ $? -ne 0 ]; then echo "Deploy failed!"; exit 1; fi

echo "----------------------------------------"
echo "       DEPLOYING AETERNA PROGRAM        "
echo "----------------------------------------"
cd /mnt/d/AETERNA/programs/aeterna
echo "1/4: Initial Build (Generating Keypair)"
anchor build
if [ $? -ne 0 ]; then echo "Build failed!"; exit 1; fi

echo "2/4: Syncing Keys"
anchor keys sync

echo "3/4: Final Build (Baking new ID into .so)"
anchor build

echo "4/4: Deploying to Devnet"
anchor deploy --provider.cluster devnet
if [ $? -ne 0 ]; then echo "Deploy failed!"; exit 1; fi

echo "== ALL SMART CONTRACTS DEPLOYED =="
