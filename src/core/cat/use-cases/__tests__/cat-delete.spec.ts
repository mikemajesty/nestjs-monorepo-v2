import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { CatDeleteInput, CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { UpdatedModel } from '@/infra/repository';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';

describe(CatDeleteUsecase.name, () => {
  let usecase: IUsecase;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (catRepository: ICatRepository) => {
            return new CatDeleteUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatDeleteInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<CatDeleteInput>('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat deleted successfully, should expect a cat deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(cat);
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>();

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual({
      ...cat,
      deletedAt: expect.any(Date)
    });
  });
});