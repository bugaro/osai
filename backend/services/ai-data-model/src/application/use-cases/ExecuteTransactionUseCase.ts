import { InvariantEngine } from '../../domain/invariants/InvariantEngine.js';
import { InvariantContext } from '../../domain/value-objects/InvariantContext.js';
import { ClientTier } from '../../domain/enums/ClientTier.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { RulesNotSyncedError } from '../../domain/errors/RulesNotSyncedError.js';
import { SSEPublisher } from '../ports/SSEPublisher.js';
import { PolicyRepository } from '../ports/PolicyRepository.js';
import { createNotification } from '../../domain/value-objects/Notification.js';
import type { ExecuteTransactionInput, ExecuteTransactionOutput } from '../dto/ExecuteTransactionDTO.js';

export class ExecuteTransactionUseCase {
  constructor(
    private readonly invariantEngine: InvariantEngine,
    private readonly ssePublisher: SSEPublisher,
    private readonly policyRepository?: PolicyRepository,
  ) {}

  async execute(input: ExecuteTransactionInput, correlationId: string): Promise<ExecuteTransactionOutput> {
    if (input.amount < 0) {
      throw new ValidationError('Amount must not be negative');
    }

    if (this.policyRepository) {
      const invariants = await this.policyRepository.loadAllInvariants();
      this.invariantEngine.loadFromNeo4j(invariants);
    }

    if (!this.invariantEngine.isLoaded()) {
      this.ssePublisher.publish(
        createNotification('warn', 'Rules Not Synced', 'Business rules not synced', correlationId),
      );
      throw new RulesNotSyncedError();
    }

    const tier = input.tier === 'Prime' ? ClientTier.Prime : ClientTier.Standard;
    const context: InvariantContext = { zone: input.location, tier, amount: input.amount };

    const result = this.invariantEngine.validateAll(context);

    if (!result.passed) {
      this.ssePublisher.publish(
        createNotification('warn', `Invariant Violation: ${result.violatedInvariant}`,
          `Amount ${result.attemptedValue} exceeds ${result.violatedInvariant} limit of ${result.maxAllowed}`,
          correlationId),
      );
      return {
        status: 'rejected',
        violatedInvariant: result.violatedInvariant,
        attemptedValue: result.attemptedValue,
        maxAllowed: result.maxAllowed,
      };
    }

    this.ssePublisher.publish(
      createNotification('info', 'Action Executed', 'Transaction completed — all policy rules satisfied', correlationId),
    );

    return { status: 'executed' };
  }
}
