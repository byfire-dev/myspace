window.AI_WEEK_ARCHIVE = {
  updatedAt: "2026-06-22",
  weeks: [
    {
      id: "2026-06-16_2026-06-22",
      range: "June 16-22, 2026",
      title: "前沿模型进入制度化管理，安全评测、算力供应与顶尖人才同步重排",
      summary: "本周 AI 的主线不是单一模型发布，而是前沿能力进入更硬的基础设施和治理周期：OpenAI 把真实对话回放纳入发布前评测，生物安全和未成年人安全成为 G7 与国会层面的议题；Anthropic 一边面对 Fable/Mythos 管制余波，一边通过 Micron 锁定内存与存储供应；Google DeepMind 的核心人才流向 OpenAI 和 Anthropic，显示模型竞赛已经同时打到算力、政策、组织和人才四条线上。",
      events: [
        {
          date: "2026-06-16",
          displayDate: "Jun 16",
          weekday: "Tue",
          org: "OpenAI",
          category: "Safety Evaluation",
          headline: "OpenAI 引入 Deployment Simulation，用真实使用场景预测模型发布风险",
          body: "OpenAI 发布 Deployment Simulation 方法，在候选模型上线前以隐私保护方式回放历史对话，观察新模型在接近真实部署的上下文中是否出现新的不良行为。相比只靠人工构造的高压测试，这类评测更像一次发布前演练：它帮助 OpenAI 在 GPT-5 系列 Thinking 模型中估计风险频率、发现评测盲区，并把安全评估扩展到带工具调用的 Agent 场景。",
          sourceUrl: "https://openai.com/index/deployment-simulation/",
          sourceName: "OpenAI",
          tags: ["Deployment Simulation", "Safety Evaluation", "Agentic Risk"],
          priority: 1
        },
        {
          date: "2026-06-17",
          displayDate: "Jun 17",
          weekday: "Wed",
          org: "Google / OpenAI",
          category: "Talent",
          headline: "Gemini 联合负责人 Noam Shazeer 离开 Google 加入 OpenAI，模型人才争夺继续升温",
          body: "9to5Google 援引 Noam Shazeer 的公开帖文报道，这位 Google VP、Gemini 联合负责人将加入 OpenAI。Shazeer 是 Transformer 时代的关键工程人物之一，也曾创办 Character.AI；他的再次流动说明，顶尖模型实验室的竞争不只发生在参数、算力和产品分发上，也发生在少数能重塑训练范式与组织节奏的人才身上。",
          sourceUrl: "https://9to5google.com/2026/06/17/geminis-co-lead-is-leaving-google-to-join-openai/",
          sourceName: "9to5Google",
          tags: ["Talent", "Gemini", "OpenAI"],
          priority: 1
        },
        {
          date: "2026-06-20",
          displayDate: "Jun 20",
          weekday: "Sat",
          org: "Google DeepMind / Anthropic",
          category: "AI Science",
          headline: "AlphaFold 核心科学家 John Jumper 转投 Anthropic，科学 AI 人才也被卷入前沿模型竞争",
          body: "TechCrunch 报道，诺贝尔化学奖得主、AlphaFold 团队核心科学家 John Jumper 宣布离开 Google DeepMind，加入 Anthropic。这个信号比普通高管流动更重：前沿实验室正在争夺能把大模型能力转化为科学发现流程的人，AI 公司的长期壁垒开始从聊天与编码延伸到科研自动化、实验设计和专业知识工作。",
          sourceUrl: "https://techcrunch.com/2026/06/20/nobel-laureate-john-jumper-is-leaving-deepmind-for-rival-anthropic/",
          sourceName: "TechCrunch",
          tags: ["DeepMind", "Anthropic", "AI for Science"],
          priority: 1
        },
        {
          date: "2026-06-22",
          displayDate: "Jun 22",
          weekday: "Mon",
          org: "Micron / Anthropic",
          category: "Infrastructure",
          headline: "Micron 与 Anthropic 达成战略协议，前沿模型竞争继续向内存与存储供应链下沉",
          body: "Micron 宣布与 Anthropic 达成战略协议，覆盖 AI 内存与存储架构设计、供应安排、Claude 在 Micron 内部采用，以及对 Anthropic Series H 的战略投资。相比单纯采购 GPU，这类合作把模型工作负载、HBM/DRAM/SSD 供应、能耗和 token economics 直接绑在一起，说明下一阶段前沿 AI 竞争会越来越像全栈基础设施工程。",
          sourceUrl: "https://investors.micron.com/news-releases/news-release-details/micron-and-anthropic-announce-strategic-agreement-scale-next",
          sourceName: "Micron",
          tags: ["AI Infrastructure", "Memory", "Anthropic"],
          priority: 1
        },
        {
          date: "2026-06-22",
          displayDate: "Jun 22",
          weekday: "Mon",
          org: "Five Eyes",
          category: "Cybersecurity",
          headline: "五眼联盟罕见警告前沿 AI 网络风险，模型能力被正式纳入企业核心风险",
          body: "The Guardian 报道，五眼联盟情报与网络安全机构发出罕见联合警告，称更强前沿模型可能在数月内显著改变网络攻防格局，并要求政府和企业把 AI 驱动的漏洞发现、攻击链自动化和关键基础设施韧性放到领导层议程。Fable/Mythos 管制余波仍在扩散，前沿模型的网络安全能力已经从实验室问题变成国家安全与企业治理问题。",
          sourceUrl: "https://www.theguardian.com/technology/2026/jun/22/anthropic-claude-fable-ai-model-artificial-intelligence-national-security",
          sourceName: "The Guardian",
          tags: ["Cybersecurity", "Frontier AI", "Critical Infrastructure"],
          priority: 2
        },
        {
          date: "2026-06-22",
          displayDate: "Jun 22",
          weekday: "Mon",
          org: "OpenAI",
          category: "Youth Safety",
          headline: "OpenAI 借 G7 议程推动全球未成年人 AI 安全标准，教育场景进入默认护栏阶段",
          body: "OpenAI 呼吁建立国际性的青年 AI 安全机构，围绕年龄识别、默认保护、年度风险评估、证据共享和教育部署形成长期标准。这个方向意味着教育 AI 的竞争焦点正在从“能不能辅导学习”转向“能不能在默认状态下适合未成年人使用”，产品设计、监管合规和学校采购会被一起改写。",
          sourceUrl: "https://openai.com/index/advancing-youth-safety-and-opportunity-through-global-leadership/",
          sourceName: "OpenAI",
          tags: ["Youth Safety", "Education", "G7"],
          priority: 2
        }
      ]
    },
    {
      id: "2026-06-01_2026-06-05",
      range: "June 1-5, 2026",
      title: "Mythos 安全争议升温，企业 Agent 与前沿治理同步加速",
      summary: "本周最强信号来自高能力模型的安全边界：Anthropic 正式扩展 Project Glasswing，围绕 Mythos/Oceanus 的泄露传闻也把红队访问、API 渠道和责任发布推到台前；同时，OpenAI 与 Microsoft 分别在前沿治理、生物安全和企业 Agent 系统上继续加码。",
      events: [
        {
          date: "2026-06-02",
          displayDate: "Jun 2",
          weekday: "Tue",
          org: "Anthropic",
          category: "Cybersecurity",
          headline: "Anthropic 扩大 Project Glasswing，Mythos 级网络安全能力进入受控扩散阶段",
          body: "Anthropic 宣布把 Project Glasswing 从约 50 个初始伙伴扩展到约 150 个组织，覆盖 15 个以上国家和电力、水务、医疗、通信、硬件等关键基础设施领域。官方强调，Claude Mythos Preview 已帮助伙伴发现大量高危或严重漏洞，但 Mythos 级模型也需要更强的访问控制、披露流程和防滥用护栏。",
          sourceUrl: "https://www.anthropic.com/news/expanding-project-glasswing",
          sourceName: "Anthropic",
          tags: ["Claude Mythos", "Cybersecurity", "Responsible Release"],
          priority: 1
        },
        {
          date: "2026-06-05",
          displayDate: "Jun 5",
          weekday: "Fri",
          org: "Anthropic",
          category: "Model Security",
          headline: "Mythos/Oceanus API 转售传闻发酵，前沿模型红队访问暴露渠道治理风险",
          body: "新智元文章称，Anthropic 内部代号 Oceanus 的 Mythos 预览通道疑似被红队访问者转卖，并流出 80 美元/百万输出 token、52 token/s 等参数。相关说法尚未获得 Anthropic 官方确认，更适合当作风险信号：当模型具备长程自主编码和网络安全能力时，红队、代理商、密钥审计和限量发布机制本身会成为安全边界的一部分。",
          sourceUrl: "https://mp.weixin.qq.com/s/s1-LSP2QjtGsWxFx9XTK6w",
          sourceName: "新智元",
          tags: ["Mythos", "Oceanus", "Red Team", "Leak Risk"],
          priority: 1
        },
        {
          date: "2026-06-03",
          displayDate: "Jun 3",
          weekday: "Wed",
          org: "OpenAI",
          category: "Governance",
          headline: "OpenAI 发布前沿 AI 民主治理蓝图，呼吁建立更持久的联邦安全框架",
          body: "OpenAI 发布 frontier safety blueprint，提出美国应建立可持续的国家级前沿 AI 治理框架、强化 CAISI 作为联邦 AI 安全机构的角色，并动员更广泛的政府韧性计划。前沿模型治理正在从公司自律扩展到国家制度设计。",
          sourceUrl: "https://openai.com/index/frontier-safety-blueprint/",
          sourceName: "OpenAI",
          tags: ["Frontier AI", "Governance", "Policy"],
          priority: 1
        },
        {
          date: "2026-06-04",
          displayDate: "Jun 4",
          weekday: "Thu",
          org: "OpenAI",
          category: "Biosecurity",
          headline: "OpenAI 发布生物防御行动计划，AI 科研能力与生物安全绑定更紧",
          body: "OpenAI 在 Biodefense in the Intelligence Age 中提出 AI 驱动的生物韧性行动计划，强调先进模型既能支持药物发现、疾病研究和公共卫生响应，也会带来生物安全风险。围绕 GPT-Rosalind 和 Rosalind Biodefense，OpenAI 的重点是把能力开放给可信防御者，同时建立证据、护栏和治理流程。",
          sourceUrl: "https://openai.com/index/biodefense-in-the-intelligence-age/",
          sourceName: "OpenAI",
          tags: ["Biodefense", "Rosalind", "Safety"],
          priority: 2
        },
        {
          date: "2026-06-02",
          displayDate: "Jun 2",
          weekday: "Tue",
          org: "Microsoft",
          category: "Enterprise Agents",
          headline: "Microsoft Build 2026 强化企业 Agent 全栈，模型、上下文、运行时和治理一起推进",
          body: "Microsoft 在 Build 2026 期间把企业 Agent 叙事从单点 Copilot 扩展成完整系统：GitHub 构建、Microsoft IQ 上下文化、Foundry 运行、Agent 365 治理，以及 Frontier Tuning 持续改进。与此同时，MAI-Thinking-1、MAI-Code-1、MAI-Image-2.5 等自研模型进入产品和 Foundry，企业 AI 竞争正在转向可治理、可观测、可持续优化的 Agent 平台。",
          sourceUrl: "https://blogs.microsoft.com/blog/2026/06/02/microsoft-build-2026-be-yourself-at-work/",
          sourceName: "Microsoft",
          tags: ["Agent Platform", "Microsoft Build", "MAI Models"],
          priority: 2
        }
      ]
    },
    {
      id: "2026-05-25_2026-05-31",
      range: "May 25-31, 2026",
      title: "Claude 重夺焦点，AI 工具、安全与教育加速落地",
      summary: "本周 Claude Opus 4.8 把前沿模型竞争重新拉回推理、长上下文和 Agent 可靠性；同时，低门槛工具、安全治理与教育 AI 正在进入更日常的使用场景。",
      events: [
        {
          date: "2026-05-28",
          displayDate: "May 28",
          weekday: "Thu",
          org: "Anthropic",
          category: "Models",
          headline: "Claude Opus 4.8 引发“最强模型”讨论，复杂任务与 Agent 可靠性成为看点",
          body: "Anthropic 发布 Claude Opus 4.8，并强调其在编码、知识工作、指令遵循和复杂 Agent 任务上的提升。对普通用户来说，这次更新的关键不只是跑分，而是复杂问题拆解、多轮对话衔接和长任务执行是否更稳。",
          sourceUrl: "https://www.anthropic.com/news/claude-opus-4-8",
          sourceName: "Anthropic",
          tags: ["Claude", "Models", "Agent Reliability"],
          priority: 1
        },
        {
          date: "2026-05-28",
          displayDate: "May 28",
          weekday: "Thu",
          org: "OpenAI",
          category: "Governance",
          headline: "OpenAI 发布 Frontier Governance Framework，前沿模型安全进入制度化阶段",
          body: "OpenAI 公布 Frontier Governance Framework，将安全与安保实践映射到新兴法律要求，并覆盖风险评估、模型报告、外部专家输入、事故响应和框架更新。大厂 AI 安全正在从原则表态走向可审计的治理流程。",
          sourceUrl: "https://openai.com/index/openai-frontier-governance-framework/",
          sourceName: "OpenAI",
          tags: ["AI Safety", "Governance", "Compliance"],
          priority: 1
        },
        {
          date: "2026-05-31",
          displayDate: "May 31",
          weekday: "Sun",
          org: "AI Tools",
          category: "Productivity",
          headline: "轻量化 AI 工具继续爆发，“零门槛”成为办公与创意产品的新卖点",
          body: "本周的应用层信号很明确：越来越多工具把文案生成、数据处理、素材设计和多模型调用包装成普通用户可直接上手的工作流。AI 产品竞争正在从“模型能力有多强”转向“谁能更快嵌入日常任务”。",
          sourceName: "用户提供材料",
          tags: ["Productivity", "Creative Tools", "No-Code AI"],
          priority: 2
        },
        {
          date: "2026-05-31",
          displayDate: "May 31",
          weekday: "Sun",
          org: "EdTech",
          category: "Education",
          headline: "教育 AI 从答疑工具转向学习路径规划，个性化辅导继续加速落地",
          body: "智能辅导产品正在把错题解析、学习历史、下一步推荐和教师辅助连成更完整的学习闭环。K12、语言学习和成人教育场景的共同方向，是让 AI 不只回答问题，而是持续理解学习者状态并给出更合适的路径。",
          sourceUrl: "https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/",
          sourceName: "Khan Academy Blog",
          tags: ["Education", "AI Tutor", "Personalization"],
          priority: 2
        }
      ]
    },
    {
      id: "2026-05-20_2026-05-28",
      range: "May 20-28, 2026",
      title: "AI 基建、编码 Agent 与治理安全",
      summary: "本周 AI 竞争继续从模型发布扩展到基础设施、开发者工作流、搜索入口和安全治理。",
      events: [
        {
          date: "2026-05-20",
          displayDate: "May 20",
          weekday: "Wed",
          org: "NVIDIA",
          category: "Infrastructure",
          headline: "NVIDIA 单季收入 816 亿美元，AI 基建需求继续外溢",
          body: "NVIDIA 公布 2027 财年第一季度业绩，收入同比增长 85%，数据中心收入达到 752 亿美元。市场信号很清楚：AI 竞争仍在从模型能力扩展到算力、网络、存储和企业基础设施。",
          sourceUrl: "https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2027",
          sourceName: "NVIDIA Newsroom",
          tags: ["AI Infrastructure", "Data Center", "Earnings"],
          priority: 1
        },
        {
          date: "2026-05-20",
          displayDate: "May 20",
          weekday: "Wed",
          org: "OpenAI",
          category: "Research",
          headline: "OpenAI 模型推翻离散几何核心猜想，AI 数学发现进入新阶段",
          body: "OpenAI 称其内部模型解决了 Erdős 1946 年提出的 planar unit distance problem，推翻长期以来关于方格构造最优的猜想。它不只是刷榜，而是一次被数学家认真审阅的研究里程碑。",
          sourceUrl: "https://openai.com/index/model-disproves-discrete-geometry-conjecture/",
          sourceName: "OpenAI",
          tags: ["Research", "Mathematics", "Reasoning"],
          priority: 1
        },
        {
          date: "2026-05-25",
          displayDate: "May 25",
          weekday: "Mon",
          org: "xAI",
          category: "Coding Agents",
          headline: "xAI 推出 Grok Build，编码 Agent 继续向终端工作流下沉",
          body: "xAI 发布 Grok Build 0.1 beta，定位为面向开发者的 CLI 编码 Agent，覆盖代码搜索、编辑、命令执行和本地项目上下文理解。编码 Agent 的竞争正在从网页聊天框转向真实开发环境。",
          sourceUrl: "https://x.ai/news/grok-build-cli",
          sourceName: "xAI",
          tags: ["Coding Agent", "CLI", "Developer Tools"],
          priority: 1
        },
        {
          date: "2026-05-27",
          displayDate: "May 27",
          weekday: "Wed",
          org: "Google",
          category: "Search",
          headline: "Google Search 让用户指定偏好来源，AI 搜索进入“来源选择”阶段",
          body: "Google 在 Search 中推出 Preferred Sources，用户可以指定更想看到的新闻和信息来源，并在 Top Stories 与搜索结果中获得更多对应内容。这意味着 AI 搜索不只是摘要能力竞争，也会重新塑造内容源、信任和分发权。",
          sourceUrl: "https://blog.google/products-and-platforms/products/search/original-high-quality-content-search/",
          sourceName: "Google Blog",
          tags: ["AI Search", "Content Distribution", "Sources"],
          priority: 2
        },
        {
          date: "2026-05-27",
          displayDate: "May 27",
          weekday: "Wed",
          org: "OpenAI",
          category: "Governance",
          headline: "OpenAI 发布选举安全更新，继续强化政治内容与媒体来源治理",
          body: "OpenAI 更新 2026 年选举安全做法，强调政治说服、候选人冒充、投票流程误导和生成媒体标识等风险控制。随着全球选举周期推进，模型公司正在把治理能力做成产品底层能力。",
          sourceUrl: "https://openai.com/index/election-safeguards-2026/",
          sourceName: "OpenAI",
          tags: ["Election Safety", "Policy", "Governance"],
          priority: 2
        },
        {
          date: "2026-05-27",
          displayDate: "May 27",
          weekday: "Wed",
          org: "Microsoft",
          category: "Safety",
          headline: "Microsoft 公布 NCII 防护进展，生成式媒体安全成为平台责任",
          body: "Microsoft 更新其应对非自愿亲密图像滥用的安全措施，覆盖检测、移除、用户申诉和与行业组织协作。生成式媒体越普及，平台对深伪滥用、身份伤害和内容溯源的责任越重。",
          sourceUrl: "https://blogs.microsoft.com/on-the-issues/2026/05/27/strengthening-our-approach-to-tackling-non-consensual-intimate-imagery/",
          sourceName: "Microsoft On the Issues",
          tags: ["AI Safety", "Synthetic Media", "NCII"],
          priority: 2
        },
        {
          date: "2026-05-28",
          displayDate: "May 28",
          weekday: "Thu",
          org: "Anthropic",
          category: "Models",
          headline: "Anthropic 发布 Claude Opus 4.8，强调效率、可靠性和 coding 表现",
          body: "Anthropic 推出 Claude Opus 4.8，并称其在保持前沿编码能力的同时提升效率、速度和指令遵循。模型竞争进入“可持续推理成本 + 高可靠 Agent 工作流”的阶段。",
          sourceUrl: "https://www.anthropic.com/news/claude-opus-4-8",
          sourceName: "Anthropic",
          tags: ["Claude", "Models", "Coding"],
          priority: 1
        },
        {
          date: "2026-05-28",
          displayDate: "May 28",
          weekday: "Thu",
          org: "Google",
          category: "Agentic Search",
          headline: "Google I/O 复盘：Gemini、Search Agents 与 SynthID 串成完整 AI 入口",
          body: "Google 总结 I/O 2026 的 12 个核心发布：Gemini Omni、Gemini 3.5 Flash、Search information agents、Antigravity 生成式 UI、Gemini Spark、Universal Cart 与 SynthID。Google 的 AI 入口正在从模型、搜索、购物、创作和内容溯源一起推进。",
          sourceUrl: "https://blog.google/innovation-and-ai/technology/ai/io-2026-keynote-moment-videos/",
          sourceName: "Google Blog",
          tags: ["Gemini", "Agentic Search", "SynthID"],
          priority: 1
        }
      ]
    }
  ]
};
