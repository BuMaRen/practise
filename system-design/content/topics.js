// Part 2: business-scenario designs. First cover principles present in CaseHub + auto-test,
// then broaden to general design. `concepts` lists the Part 1 drills to do first (content/concepts.js).
// Only S06 explicitly uses the projects as its scenario.
export const TOPICS = [
  {id:'S01',title:'异步任务平台',focus:'任务归属、队列、容量感知调度、执行节点扩缩容',scenario:'一个平台接收大量耗时任务，需要让用户提交、查询进度和取得结果',projectRelevant:true,concepts:['message-queue','stateless-scaling','load-balancing','capacity']},
  {id:'S02',title:'长任务中断',focus:'服务重启、节点丢失、checkpoint、敏感数据的持久化边界',scenario:'一些任务运行数十分钟，用户希望服务或机器故障后仍能得到结果',projectRelevant:true,concepts:['retry-timeout','idempotency','replication','consensus']},
  {id:'S03',title:'重复请求与外部写入',focus:'至少一次执行、重复请求、阶段性提交、外部副作用去重',scenario:'工作流会写入外部系统，客户端可能重复提交，处理过程也可能中断',projectRelevant:true,concepts:['idempotency','distributed-transactions','message-queue','retry-timeout']},
  {id:'S04',title:'变化中的工作知识',focus:'知识或缓存的归属、命中条件、在线校验、局部修正',scenario:'一个智能系统希望复用过去的操作经验，但目标环境会变化',projectRelevant:true,concepts:['cache-patterns','consistency-models']},
  {id:'S05',title:'AI 产物上线流程',focus:'风险分级、置信度、审计、自动放行与人工介入门槛',scenario:'AI 生成的产物要进入生产流程，错误放行会造成业务损失',projectRelevant:true,concepts:['observability','cqrs-events']},
  {id:'S06',title:'质量工程平台设计',focus:'CaseHub／auto-test 分工、任务恢复与幂等、产物追溯、经验复用与失效、自动放行边界',scenario:'可以直接以 CaseHub + auto-test 为场景，解释实际架构与有证据支撑的改造取舍；区分当前实现和建议方案',projectRelevant:true,concepts:['message-queue','stateless-scaling','idempotency','observability']},
  {id:'S07',title:'协作数据平台',focus:'实体边界、状态机、事务、读写一致性与并发更新',scenario:'多人同时修改同一份业务数据，用户需要看到可靠的结果',projectRelevant:false,concepts:['transactions','consistency-models','distributed-lock','replication']},
  {id:'S08',title:'业务事件通知',focus:'生产消费、顺序、积压、死信、重放和交付语义',scenario:'一次业务动作要触发多个后续处理，流量和处理耗时有波动',projectRelevant:false,concepts:['message-queue','idempotency','retry-timeout','cqrs-events']},
  {id:'S09',title:'热门内容访问',focus:'缓存策略、失效、热点、穿透、降级与一致性取舍',scenario:'一个内容服务的热门内容访问量远高于更新量',projectRelevant:false,concepts:['cache-patterns','cache-failures','cdn','consistent-hashing']},
  {id:'S10',title:'突发流量服务',focus:'容量估算、瓶颈、背压、限流、隔离与成本',scenario:'活动开始时流量陡增，系统仍需要维持核心业务可用',projectRelevant:false,concepts:['capacity','rate-limiting','circuit-breaker','stateless-scaling']},
  {id:'S11',title:'跨服务故障排查',focus:'指标、日志、追踪、告警、SLO 与故障演练',scenario:'用户请求经过多个服务，故障时很难确定问题位置',projectRelevant:false,concepts:['observability','retry-timeout','circuit-breaker']},
  {id:'S12',title:'多租户协作平台',focus:'身份认证、授权边界、租户隔离、密钥保护和审计记录',scenario:'多家公司共用一个平台，各自的数据和操作需要隔离',projectRelevant:false,concepts:['authn-authz','sharding','rate-limiting']},
];
