import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

import { PostgresEquipmentLoanRepository } from './infrastructure/PostgresEquipmentLoanRepository.js';
import { EquipmentLoanValidator } from './domain/services/EquipmentLoanValidator.js';
import { GetEquipmentLoansUseCase } from './application/GetEquipmentLoanUseCase.js';
import { CreateEquipmentLoanUseCase } from './application/CreateEquipmentLoanUseCase.js';
import { EquipmentLoanController } from './delivery/EquipmentLoanController.js';
import { UpdateEquipmentLoanUseCase } from './application/UpdateEquipmentLoanUseCase.js';

import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.ts'
import { SportValidator } from './domain/services/SportValidator.ts'
import { CreateSportUseCase } from './application/CreateSportUseCase.ts'
import { GetSportsUseCase } from './application/GetSportsUseCase.ts'
import { UpdateSportUseCase } from './application/UpdateSportUseCase.ts'
import { DeleteSportUseCase } from './application/DeleteSportUseCase.ts'
import { SportController } from './delivery/SportController.ts'

import { PostgresEnrollmentRepository } from './infrastructure/PostgresEnrollmentRepository.ts'
import { EnrollmentValidator } from './domain/services/EnrollmentValidator.ts'
import { CreateEnrollmentUseCase } from './application/CreateEnrollmentUseCase.ts'
import { EnrollmentController } from './delivery/EnrollmentController.ts'

import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/CreateLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';

import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/CreateDisciplineUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { GetDisciplinesUseCase } from './application/GetDisciplinesUseCase.js';
import { GetLockersUseCase } from './application/GetLockersUseCase.js';
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';
import { UpdateLockerUseCase } from './application/UpdateLockerUseCase.js';

import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js';
import { CreatePaymentUseCase } from './application/CreatePaymentUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';
import { GetPaymentUseCase } from './application/GetPaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/UpdatePaymentUseCase.js';


export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                }
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // MEMBER
    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);

    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // PAYMENT
    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator(paymentRepo, memberRepo);

    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, paymentValidator);
    const getPaymentUseCase = new GetPaymentUseCase(paymentRepo);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo, memberRepo, paymentValidator);

    const paymentController = new PaymentController(
        createPaymentUseCase,
        getPaymentUseCase,
        updatePaymentUseCase,
    );

    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.put('/api/v1/payments/:id', paymentController.update.bind(paymentController));

    // EQUIPMENT-LOAN
    const equipmentLoanRepository = new PostgresEquipmentLoanRepository();
    const equipmentLoanValidator = new EquipmentLoanValidator(equipmentLoanRepository, memberRepo);
    const getEquipmentLoansUseCase = new GetEquipmentLoansUseCase(equipmentLoanRepository);
    const createEquipmentLoanUseCase = new CreateEquipmentLoanUseCase(equipmentLoanRepository, equipmentLoanValidator);
    const updateEquipmentLoanUseCase = new UpdateEquipmentLoanUseCase(equipmentLoanRepository, equipmentLoanValidator); 
    
    const equipmentLoanController = new EquipmentLoanController(
        createEquipmentLoanUseCase,
        getEquipmentLoansUseCase,
        updateEquipmentLoanUseCase
    );

    server.get('/api/v1/equipment-loans', equipmentLoanController.getAll.bind(equipmentLoanController));
    server.post('/api/v1/equipment-loans', equipmentLoanController.create.bind(equipmentLoanController));

    // SPORT
    const sportRepository = new PostgresSportRepository();
    const sportValidator = new SportValidator(sportRepository);

    const createSportUseCase = new CreateSportUseCase(sportRepository, sportValidator);
    const getSportsUseCase = new GetSportsUseCase(sportRepository);
    const updateSportUseCase = new UpdateSportUseCase(sportRepository, sportValidator);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepository, sportValidator);

    const sportController = new SportController(
        createSportUseCase,
        getSportsUseCase,
        updateSportUseCase,
        deleteSportUseCase
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.put('/api/v1/payments/:id', paymentController.update.bind(paymentController));
    
    server.get('/api/v1/equipment-loans', equipmentLoanController.getAll.bind(equipmentLoanController));
    server.post('/api/v1/equipment-loans', equipmentLoanController.create.bind(equipmentLoanController));
    server.put('/api/v1/equipment-loans/:id', equipmentLoanController.update.bind(equipmentLoanController));
    
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.put('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));

    // ENROLLMENT
    const enrollmentRepository = new PostgresEnrollmentRepository();
    const enrollmentValidator = new EnrollmentValidator(enrollmentRepository, sportRepository);

    const createEnrollmentUseCase = new CreateEnrollmentUseCase(enrollmentRepository, enrollmentValidator);

    const enrollmentController = new EnrollmentController(
        createEnrollmentUseCase,
    );

    server.post('/api/v1/enrollments', enrollmentController.create.bind(enrollmentController));

    // LOCKER
    const lockerRepository = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepository, memberRepo);
    const createLockerUseCase = new CreateLockerUseCase(lockerRepository, lockerValidator);
    const getLockersUseCase = new GetLockersUseCase(lockerRepository);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepository, lockerValidator);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepository, lockerValidator);
    const lockerController = new LockerController(
        createLockerUseCase,
        getLockersUseCase,
        updateLockerUseCase,
        deleteLockerUseCase,
    );

    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));
    server.put('/api/v1/lockers/:id', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));

    // DISCIPLINE
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();

    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, disciplineValidator, memberValidator);
    const getDisciplinesUseCase = new GetDisciplinesUseCase(disciplineRepo);

    const disciplineController = new DisciplineController(createDisciplineUseCase, getDisciplinesUseCase);

    server.post('/api/v1/disciplines',disciplineController.create.bind(disciplineController));
    server.get('/api/v1/disciplines',disciplineController.getAll.bind(disciplineController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}
