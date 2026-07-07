import { CasperClient, Keys, DeployUtil, RuntimeArgs, CLValueBuilder } from "casper-js-sdk";

const RPC = process.env.CASPER_RPC_URL || "https://node.casper.network/rpc";
const OPERATOR_KEY_PATH = process.env.OPERATOR_KEY_PATH || "";
const GUARDRAIL_HASH = process.env.GUARDRAIL_CONTRACT_HASH!;
const POLL_MS = parseInt(process.env.POLL_MS || "10000");
const THRESHOLD = parseFloat(process.env.HEALTH_THRESHOLD || "1.35");

interface Position {
  user: string;
  pool: string;
  health: number;
}

// Simulated positions (in production: fetch from contract + DeFi queries)
const positions: Position[] = [
  { user: "account-hash-e5c617e1471fa276361a56d532755c0848645c0d74bc1e9164059a5f631d2038", pool: "CSPR-USDC LP", health: 1.82 },
];

async function callRebalance(client: CasperClient, key: Keys.Ed25519 | Keys.Secp256K1, user: string, pool: string) {
  const deployParams = new DeployUtil.DeployParams(key.publicKey, "casper-test", 1, 1800000);
  const args = RuntimeArgs.fromMap({ user: CLValueBuilder.key(CLValueBuilder.accountHash(user)) });
  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    Buffer.from(GUARDRAIL_HASH.replace("hash-", ""), "hex"), "rebalance", args
  );
  const deploy = DeployUtil.makeDeploy(deployParams, session, DeployUtil.standardPayment(2500000000));
  const signed = DeployUtil.signDeploy(deploy, key);
  const hash = await client.putDeploy(signed);
  console.log(`[GUARDRAIL] Rebalance triggered for ${user} — Deploy: ${hash}`);
}

async function main() {
  if (!GUARDRAIL_HASH) { console.error("GUARDRAIL_CONTRACT_HASH env required"); process.exit(1); }
  const key = Keys.Ed25519.loadKeyPairFromPrivateFile(OPERATOR_KEY_PATH);
  const client = new CasperClient(RPC);
  console.log(`[GUARDRAIL] Agent started — monitoring ${positions.length} positions`);
  console.log(`[GUARDRAIL] Threshold: ${THRESHOLD} | Contract: ${GUARDRAIL_HASH}`);

  setInterval(async () => {
    for (const pos of positions) {
      // Simulate health drift (in production: query DeFi protocol + oracle)
      const drift = (Math.random() - 0.48) * 0.06;
      pos.health = Math.max(0.5, Math.min(3.0, pos.health + drift));
      console.log(`[CHECK] ${pos.pool} — ${pos.user.slice(0, 16)}... — Health: ${pos.health.toFixed(3)}`);

      if (pos.health < THRESHOLD) {
        console.log(`⚠️  BREACH — ${pos.pool} health ${pos.health.toFixed(3)} < ${THRESHOLD}`);
        try {
          await callRebalance(client, key, pos.user, pos.pool);
          pos.health = 2.0; // reset after rebalance
        } catch (e: any) {
          console.error(`[ERROR] Rebalance failed: ${e.message}`);
        }
      }
    }
  }, POLL_MS);
}

main().catch(console.error);
