import { Address } from '@stellar/stellar-sdk';

/**
 * MOCK STELLAR ASSET CONTRACT (SAC)
 * Simulates the behavior of the XLM SAC without network dependency.
 */
class MockSAC {
    public balances: Map<string, bigint> = new Map();
    public transfers: { from: string, to: string, amount: bigint }[] = [];

    /**
     * Mint tokens to an address (simulates funding/admin actions)
     */
    mint(to: string, amount: bigint) {
        const current = this.balances.get(to) || 0n;
        this.balances.set(to, current + amount);
    }

    /**
     * Transfer tokens between addresses
     */
    transfer(from: string, to: string, amount: bigint) {
        const fromBalance = this.balances.get(from) || 0n;
        if (fromBalance < amount) {
            throw new Error("Insufficient balance in SAC: pool is empty or balance too low");
        }
        this.balances.set(from, fromBalance - amount);
        const toBalance = this.balances.get(to) || 0n;
        this.balances.set(to, toBalance + amount);
        this.transfers.push({ from, to, amount });
    }

    /**
     * Get balance of an address
     */
    balance(address: string): bigint {
        return this.balances.get(address) || 0n;
    }
}

interface RewardRecord {
    user: string;
    lessonId: string;
    amount: bigint;
    timestamp: number;
}

/**
 * REWARDS CONTRACT MOCK
 * Simulates the Soroban Rewards Contract logic in TypeScript.
 */
class RewardsContract {
    public admin: string | null = null;
    public xlmToken: MockSAC | null = null;
    public xlmTokenAddress: string | null = null;
    public contractAddress: string = "CBREWARDS123456789"; // Simulated contract address
    
    private userRewards: Map<string, bigint> = new Map();
    private lessonRewarded: Set<string> = new Set(); // key: "user:lessonId"
    private history: RewardRecord[] = [];
    private totalDistributed: bigint = 0n;
    private mockTimestamp: number = Date.now();

    /**
     * Initialize the contract state
     */
    initialize(admin: string, xlmToken: MockSAC, xlmTokenAddress: string) {
        if (this.admin) throw new Error("Contract already initialized");
        this.admin = admin;
        this.xlmToken = xlmToken;
        this.xlmTokenAddress = xlmTokenAddress;
    }

    /**
     * Deposit XLM into the contract pool
     */
    deposit(from: string, amount: bigint) {
        if (!this.xlmToken) throw new Error("Token not configured");
        this.xlmToken.transfer(from, this.contractAddress, amount);
    }

    /**
     * Distribute rewards to a user
     */
    reward_user(user: string, lessonId: string, amount: bigint, score: number): bigint {
        if (!this.admin || !this.xlmToken) throw new Error("Contract not initialized");
        
        if (!user || user.trim() === "") throw new Error("Invalid user address");
        if (!lessonId || lessonId.trim() === "") throw new Error("Invalid lesson ID");

        // Anti double-claim protection
        const claimKey = `${user}:${lessonId}`;
        if (this.lessonRewarded.has(claimKey)) {
            throw new Error("User already rewarded for this lesson");
        }

        // Calculate final amount with 10% bonus for perfect score
        let finalAmount = amount;
        if (score === 100) {
            finalAmount = amount + (amount / 10n); // Deterministic bigint division
        }

        // Execute transfer via SAC
        this.xlmToken.transfer(this.contractAddress, user, finalAmount);

        // Update in-memory state
        this.lessonRewarded.add(claimKey);
        this.userRewards.set(user, (this.userRewards.get(user) || 0n) + finalAmount);
        this.totalDistributed += finalAmount;
        
        // Advance mock timestamp for chronological ordering tests
        this.mockTimestamp += 1000; 

        this.history.push({
            user,
            lessonId,
            amount: finalAmount,
            timestamp: this.mockTimestamp
        });

        return finalAmount;
    }

    /**
     * Get reward history for a user
     */
    get_reward_history(user: string): RewardRecord[] {
        // Return sorted by timestamp (though push handles it, we ensure it's explicit)
        return this.history
            .filter(h => h.user === user)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get current pool balance
     */
    pool_balance(): bigint {
        if (!this.xlmToken) return 0n;
        return this.xlmToken.balance(this.contractAddress);
    }

    /**
     * Get total distributed across all users
     */
    get_total_distributed(): bigint {
        return this.totalDistributed;
    }
}

// --- UNIT TESTS ---

describe('Rewards Contract', () => {
    let contract: RewardsContract;
    let sac: MockSAC;
    const adminAddr = "GA5W...ADMIN";
    const userAddr = "GB7P...USER1";
    const sacAddr = "CASAC...XLM";

    beforeEach(() => {
        sac = new MockSAC();
        contract = new RewardsContract();
    });

    describe('1. Test File Setup & Initialization', () => {
        test('should initialize with correct XLM SAC', () => {
            contract.initialize(adminAddr, sac, sacAddr);
            expect(contract.admin).toBe(adminAddr);
            expect(contract.xlmTokenAddress).toBe(sacAddr);
            expect(contract.pool_balance()).toBe(0n);
        });

        test('should fail if initialized twice', () => {
            contract.initialize(adminAddr, sac, sacAddr);
            expect(() => contract.initialize(adminAddr, sac, sacAddr)).toThrow("Contract already initialized");
        });
    });

    describe('2. Deposit Logic', () => {
        test('should update pool balance on deposit', () => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(adminAddr, 1000n);
            
            contract.deposit(adminAddr, 500n);
            
            expect(contract.pool_balance()).toBe(500n);
            expect(sac.balance(adminAddr)).toBe(500n);
            expect(sac.balance(contract.contractAddress)).toBe(500n);
        });

        test('should fail deposit if sender has insufficient funds', () => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(adminAddr, 100n);
            
            expect(() => contract.deposit(adminAddr, 500n)).toThrow("Insufficient balance in SAC");
        });
    });

    describe('3. Reward Distribution Logic', () => {
        beforeEach(() => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(contract.contractAddress, 5000n); // Fund the pool
        });

        test('should reward user and record history', () => {
            const amount = 1000n;
            const lessonId = "lesson_blockchain_101";
            const finalAmount = contract.reward_user(userAddr, lessonId, amount, 85);

            expect(finalAmount).toBe(1000n);
            expect(sac.balance(userAddr)).toBe(1000n);
            expect(contract.pool_balance()).toBe(4000n);
            
            const history = contract.get_reward_history(userAddr);
            expect(history.length).toBe(1);
            expect(history[0].lessonId).toBe(lessonId);
            expect(history[0].amount).toBe(1000n);
            expect(history[0].user).toBe(userAddr);
        });

        test('should apply 10 percent bonus for perfect score (100)', () => {
            const amount = 1000n;
            const finalAmount = contract.reward_user(userAddr, "lesson_perfect", amount, 100);

            // 1000 + 10% = 1100
            expect(finalAmount).toBe(1100n);
            expect(sac.balance(userAddr)).toBe(1100n);
            expect(contract.pool_balance()).toBe(3900n);
        });

        test('should handle zero bonus for score < 100', () => {
            const amount = 1000n;
            const finalAmount = contract.reward_user(userAddr, "lesson_99", amount, 99);
            expect(finalAmount).toBe(1000n);
        });
    });

    describe('4. Safety & Anti-Fraud', () => {
        beforeEach(() => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(contract.contractAddress, 5000n);
        });

        test('should prevent double claim for same user and lesson', () => {
            contract.reward_user(userAddr, "lesson_1", 100n, 80);
            
            expect(() => {
                contract.reward_user(userAddr, "lesson_1", 100n, 80);
            }).toThrow("User already rewarded for this lesson");
            
            // Pool should only have decreased once
            expect(contract.pool_balance()).toBe(4900n);
            expect(contract.get_reward_history(userAddr).length).toBe(1);
        });

        test('should allow same user to claim different lessons', () => {
            contract.reward_user(userAddr, "lesson_1", 100n, 80);
            contract.reward_user(userAddr, "lesson_2", 100n, 80);
            
            expect(contract.get_reward_history(userAddr).length).toBe(2);
            expect(sac.balance(userAddr)).toBe(200n);
        });

        test('should fail when pool balance is empty', () => {
            const contractEmpty = new RewardsContract();
            contractEmpty.initialize(adminAddr, sac, sacAddr);
            // No funds added to contractEmpty.contractAddress
            
            expect(() => {
                contractEmpty.reward_user(userAddr, "lesson_1", 100n, 80);
            }).toThrow("Insufficient balance in SAC");
        });
    });

    describe('5. Reward History Queries', () => {
        test('get_reward_history should return entries in chronological order', () => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(contract.contractAddress, 5000n);

            contract.reward_user(userAddr, "lesson_A", 100n, 80);
            contract.reward_user(userAddr, "lesson_B", 200n, 80);
            contract.reward_user(userAddr, "lesson_C", 300n, 80);

            const history = contract.get_reward_history(userAddr);
            expect(history.length).toBe(3);
            expect(history[0].lessonId).toBe("lesson_A");
            expect(history[1].lessonId).toBe("lesson_B");
            expect(history[2].lessonId).toBe("lesson_C");
            
            // Verify timestamps are strictly increasing
            expect(history[1].timestamp).toBeGreaterThan(history[0].timestamp);
            expect(history[2].timestamp).toBeGreaterThan(history[1].timestamp);
        });
    });

    describe('6. Edge Cases', () => {
        beforeEach(() => {
            contract.initialize(adminAddr, sac, sacAddr);
            sac.mint(contract.contractAddress, 10n ** 24n); // Very large pool
        });

        test('should throw error for invalid (empty) user address', () => {
            expect(() => contract.reward_user("", "lesson_1", 100n, 80)).toThrow("Invalid user address");
            expect(() => contract.reward_user("   ", "lesson_1", 100n, 80)).toThrow("Invalid user address");
        });

        test('should throw error for invalid (empty) lesson ID', () => {
            expect(() => contract.reward_user(userAddr, "", 100n, 80)).toThrow("Invalid lesson ID");
        });

        test('should handle extremely large reward values (overflow safety)', () => {
            const largeAmount = 10n ** 20n; // 100 Quintillion stroops
            const finalAmount = contract.reward_user(userAddr, "large_reward", largeAmount, 100);
            
            const expected = largeAmount + (largeAmount / 10n);
            expect(finalAmount).toBe(expected);
            expect(sac.balance(userAddr)).toBe(expected);
        });

        test('multiple users interacting sequentially', () => {
            const user2 = "GB22...USER2";
            const user3 = "GB33...USER3";
            
            contract.reward_user(userAddr, "L1", 100n, 80);
            contract.reward_user(user2, "L1", 200n, 100); // 220
            contract.reward_user(user3, "L2", 300n, 90);
            
            expect(sac.balance(userAddr)).toBe(100n);
            expect(sac.balance(user2)).toBe(220n);
            expect(sac.balance(user3)).toBe(300n);
            expect(contract.get_total_distributed()).toBe(620n);
        });
    });
});
