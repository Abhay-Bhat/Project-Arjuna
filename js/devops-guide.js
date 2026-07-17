'use strict';
/* DevOps Interview Mastery Guide — data + renderer */

// ── Helpers ────────────────────────────────────────────────
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _ladder(rows) {
  return `<table class="gfl-table"><tr><th>Level</th><th>Own this</th></tr>${
    rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')
  }</table>`;
}
function _qa(items) {
  return items.map((q,i)=>`<div class="gqa-item"><div class="gqa-q" data-qi="${i}"><span>${q.q}</span><span class="gqa-toggle">▾</span></div><div class="gqa-a">${q.a}</div></div>`).join('');
}
function _ex(title, body) {
  return `<div class="gex-item"><div class="gex-title">${title}</div>${body}</div>`;
}
function _code(lang, txt) {
  return `<pre class="gcode"># ${lang}\n${_esc(txt)}</pre>`;
}
function _note(txt) { return `<div class="gnote">${txt}</div>`; }
function _sec(title, body) { return `<div class="gs-title">${title}</div>${body}`; }
function _res(items) {
  return `<ul class="gres-list">${items.map(r=>`<li>${r.star?'<span class="gres-star">★</span> ':''}<a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.label}</a>${r.note?' — <em>'+r.note+'</em>':''}</li>`).join('')}</ul>`;
}

// ── Guide Data ─────────────────────────────────────────────
const GUIDE_MODULES = [

  // ── MODULE 0: PREP STRATEGY ────────────────────────────────
  { id:'prep', icon:'🎯', title:'Prep Strategy',
    subtitle:'12-month roadmap + self-assessment + your real story',
    content: ()=>`
      ${_note('Your 3 stated gaps: <strong>CD/GitOps</strong>, <strong>fundamentals</strong> (Docker/K8s/AWS), and <strong>articulating wins in interviews</strong>. This roadmap closes all three.')}
      ${_sec('76-WEEK TECH ROADMAP', `
        <table class="gfl-table">
          <tr><th>Phase</th><th>Period</th><th>Hours</th><th>Focus</th><th>Cert Target</th></tr>
          <tr><td>1</td><td>Wk 1–2 · Jul 2026</td><td>9h</td><td>Docker Foundations</td><td>—</td></tr>
          <tr><td>2</td><td>Wk 3–12 · Jul–Sep 2026</td><td>45h</td><td>Kubernetes + CKA</td><td>CKA (Wk 10–12)</td></tr>
          <tr><td>3</td><td>Wk 13–18 · Oct–Nov 2026</td><td>27h</td><td>OpenShift Deep-dive</td><td>—</td></tr>
          <tr><td>4</td><td>Wk 19–30 · Nov 2026–Feb 2027</td><td>54h</td><td>Groovy + Jenkins + ArgoCD</td><td>—</td></tr>
          <tr><td>5</td><td>Wk 31–44 · Feb–May 2027</td><td>63h</td><td>Terraform + AWS SAA</td><td>Terraform Assoc (Wk 34–36), AWS SAA (Wk 43–44)</td></tr>
          <tr><td>6</td><td>Wk 45–54 · May–Aug 2027</td><td>45h</td><td>Python + Networking + Mesh</td><td>—</td></tr>
          <tr><td>7</td><td>Wk 55–63 · Aug–Sep 2027</td><td>40h</td><td>Observability + Security</td><td>—</td></tr>
          <tr><td>8</td><td>Wk 64–76 · Sep–Dec 2027</td><td>58h</td><td>System Design + GenAI + PSM I</td><td>PSM I (Wk 74)</td></tr>
        </table>
        ${_note('Cadence: 30 min weekdays + 1h Saturdays ≈ 4.5 hrs/week ≈ 341 hrs total over 76 weeks.')}
      `)}
      ${_sec('SELF-ASSESSMENT — Scores = operational depth without AI/docs help (1–10)', `
        <table class="gfl-table">
          <tr><th>Area</th><th>Score</th><th>Priority</th><th>Gap</th></tr>
          <tr><td>Docker</td><td>2</td><td>🔴 High — Start here</td><td>Networking / volumes / layer caching</td></tr>
          <tr><td>Kubernetes</td><td>1</td><td>🔴 Critical</td><td>Pod lifecycle / scheduling / StatefulSets</td></tr>
          <tr><td>AWS</td><td>1</td><td>🔴 High</td><td>VPC / IAM / EKS / CloudWatch</td></tr>
          <tr><td>CI/CD & GitOps</td><td>2</td><td>🔴 High — Biggest gap</td><td>ArgoCD / GitOps loop / pipeline design</td></tr>
          <tr><td>IaC / Terraform</td><td>1</td><td>🟡 Low — skip</td><td>Learn on job</td></tr>
          <tr><td>OpenShift</td><td>5</td><td>🟢 Specialisation</td><td>Own this</td></tr>
          <tr><td>Observability</td><td>2</td><td>🟡 Low — skip</td><td>—</td></tr>
          <tr><td>SRE</td><td>2</td><td>🟡 Low — skip</td><td>—</td></tr>
          <tr><td>Linux/OS</td><td>3</td><td>🟡 Medium</td><td>Process / signal / perf tools</td></tr>
          <tr><td>Networking</td><td>3</td><td>🟡 Medium</td><td>DNS / TLS / iptables</td></tr>
          <tr><td>Security</td><td>3</td><td>🟡 Medium</td><td>RBAC / NetworkPolicy / supply chain</td></tr>
          <tr><td>System Design</td><td>3</td><td>🟡 Medium</td><td>7-step framework</td></tr>
          <tr><td>Scripting</td><td>3</td><td>🟡 Medium</td><td>Automation patterns</td></tr>
        </table>
      `)}
      ${_sec('YOUR REAL WINS (use in behavioral rounds)', `
        <table class="gfl-table">
          <tr><th>Theme</th><th>Story</th></tr>
          <tr><td>Technical Win</td><td>5h → 1.5h build time (70% reduction) — ZENworks macOS agent pipeline via profiling + parallelisation of Maven/Bash stages</td></tr>
          <tr><td>Innovation</td><td>RAG documentation tool cutting onboarding 3wk → 1wk; LLM pipeline log investigator cutting triage time 40%</td></tr>
          <tr><td>Leadership</td><td>Power Automate flow reducing DevOps request turnaround 63% (3.5 days → 1.3 days); Scrum Master role</td></tr>
          <tr><td>Cross-team Impact</td><td>Code-signing standardisation across BUs, 40% fewer incidents; 10+ repo GitHub → GitLab zero-loss migration</td></tr>
        </table>
      `)}
    `
  },

  // ── MODULE 1: LINUX ─────────────────────────────────────────
  { id:'linux', icon:'🐧', title:'Linux & OS Fundamentals',
    subtitle:'Process model, memory, filesystems, signals, performance',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','boot sequence (BIOS→kernel→init), process states (R/S/D/Z/T), file permissions (rwx, SUID/SGID/sticky), filesystem hierarchy, basic commands'],
        ['Intermediate','systemd units, cgroups + namespaces (the container foundation), signals (SIGTERM/SIGKILL/SIGHUP), /proc & /sys, memory (virtual vs RSS, OOM killer), swap'],
        ['Advanced','USE method for perf: CPU (run queue, context switches), memory (page faults, cache), I/O (await, saturation); eBPF/perf/strace, inode exhaustion, TCP tunables']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Explain the Linux boot process.',
          a:'POST → BIOS/UEFI finds bootable device → bootloader (GRUB2) loads kernel + initramfs → kernel initialises hardware, mounts root FS → systemd (PID 1) runs targets in dependency order until multi-user or graphical. Understanding this matters for debugging kernel panics and startup failures.' },
        { q:'What are cgroups and namespaces — and how do containers use them?',
          a:'<strong>Namespaces</strong> give a process an isolated view of system resources: PID namespace (own PID 1), network namespace (own interfaces/routes), mount namespace (own filesystem tree), UTS (own hostname), IPC, user namespace. <strong>cgroups</strong> limit and account resource <em>consumption</em>: CPU shares/quota, memory limit, I/O weight. A container is just a process with a set of namespaces for isolation and cgroups for limits — no magic.' },
        { q:'How do you diagnose high CPU on a Linux server?',
          a:'Layered: <code>top</code>/<code>htop</code> to see which PID is hot → <code>ps aux</code> for the command → <code>strace -p PID</code> to see syscalls → <code>perf top -p PID</code> for hot functions. Check run queue with <code>vmstat 1</code> (r column). If kernel CPU is high, look at soft IRQ (<code>sar -I ALL</code>) or network interrupt affinity. USE method: Utilisation (is CPU at 100%?), Saturation (run queue > nCPU?), Errors (MCE/hardware).' },
        { q:'What is the OOM killer and how do you control it?',
          a:'When the kernel cannot satisfy a memory allocation, the OOM killer selects a process to kill based on an oom_score (higher = more likely to die). Factors: memory usage, children, nice value. Control: set <code>/proc/PID/oom_score_adj</code> (-1000 = never kill, +1000 = kill first); in K8s, Guaranteed QoS pods get oom_score_adj=-997 (rarely killed), BestEffort pods get +1000 (first to die). This is why setting requests = limits matters.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('1.1 — Process investigation', _code('bash',
`ps aux --sort=-%cpu | head -10
cat /proc/$(pgrep nginx | head -1)/status | grep -E 'VmRSS|Threads|State'
ls -la /proc/$(pgrep nginx | head -1)/fd | wc -l  # open file descriptors`))}
        ${_ex('1.2 — Namespace exploration', _code('bash',
`# See namespaces of a process
ls -la /proc/1/ns/
# Enter a container's network namespace
nsenter -t $(docker inspect -f '{{.State.Pid}}' mycontainer) -n -- ip addr`))}
        ${_ex('1.3 — cgroup limits', _code('bash',
`# Check cgroup limits for a K8s pod
cat /sys/fs/cgroup/memory/kubepods/.../memory.limit_in_bytes
# Simulate OOM
cat /proc/meminfo | grep MemAvailable`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://linuxjourney.com', label:'Linux Journey', note:'free, beginner→intermediate'},
        {star:true, url:'https://www.brendangregg.com/linuxperf.html', label:'Brendan Gregg — Linux Performance'},
        {url:'https://killercoda.com', label:'Killercoda Linux scenarios'}
      ]))}
    `
  },

  // ── MODULE 2: NETWORKING ────────────────────────────────────
  { id:'net', icon:'🌐', title:'Networking Fundamentals',
    subtitle:'TCP/IP, DNS, TLS, iptables, CNI',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','OSI model (L3 IP routing, L4 TCP/UDP), TCP 3-way handshake, DNS resolution chain, HTTP/S basics, common ports'],
        ['Intermediate','TLS 1.3 handshake, iptables chains (PREROUTING/POSTROUTING/FORWARD), NAT/MASQUERADE, VXLAN overlays, Kubernetes kube-proxy (iptables/ipvs mode), CNI plugins (Calico/Cilium/Flannel)'],
        ['Advanced','eBPF-based networking (Cilium), BGP for pod routing, service mesh (mTLS, Envoy sidecar), network policy enforcement, TCP tuning (BBR, TIME_WAIT), DNS negative caching issues in K8s']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Walk me through what happens when a browser hits https://example.com.',
          a:'DNS lookup (resolver → root → TLD → authoritative) → TCP 3-way handshake to port 443 → TLS 1.3 handshake (ClientHello with SNI, server cert, key exchange, Finished) → HTTP/2 or HTTP/1.1 GET / → server responds → TLS record decryption → browser renders. Each step is a failure domain: DNS timeout, TCP RST, cert error, application 5xx.' },
        { q:'How does kube-proxy implement Service routing?',
          a:'In iptables mode (default): kube-proxy watches the API server for Service/Endpoint changes and programs iptables DNAT rules in the KUBE-SERVICES chain. Traffic to ClusterIP:port is matched, then randomly DNATed to one of the pod IPs via a statistic rule (1/n probability chain). In ipvs mode, it uses the kernel\'s IPVS virtual server table (faster at scale, O(1) lookup vs O(n) iptables). Cilium replaces kube-proxy entirely with eBPF maps.' },
        { q:'What is CNI and how does Calico implement pod networking?',
          a:'CNI (Container Network Interface) is a spec + set of plugins called by the kubelet when a pod is created/deleted. Calico in BGP mode: each node runs Bird (BGP daemon) and advertises pod CIDR routes to other nodes. No overlay needed — traffic is routed natively at L3. Felix programs iptables/eBPF rules for NetworkPolicy enforcement. In VXLAN mode it adds an L2-over-UDP overlay for environments where BGP is blocked.' },
        { q:'Explain TLS mutual authentication (mTLS).',
          a:'Standard TLS: client verifies server cert. mTLS: server also verifies client cert — both sides prove identity. In a service mesh (Istio/Linkerd), each pod gets a workload certificate (SPIFFE SVID). The sidecar proxy terminates mTLS at pod entry, meaning the app only sees plain HTTP but all inter-pod traffic is encrypted and authenticated. This is the zero-trust "never trust based on network location" implementation.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('2.1 — DNS debugging', _code('bash',
`dig +trace example.com           # full resolution chain
dig @8.8.8.8 kubernetes.default.svc.cluster.local  # in-cluster DNS
kubectl exec -it debug -- nslookup my-svc.my-ns`))}
        ${_ex('2.2 — iptables tracing in K8s', _code('bash',
`iptables -t nat -L KUBE-SERVICES -n | grep my-svc
# Trace a packet
iptables -t raw -A PREROUTING -p tcp --dport 80 -j TRACE
iptables -t raw -A OUTPUT -p tcp --dport 80 -j TRACE`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://wizardzines.com', label:'Julia Evans zines', note:'TCP, DNS, tcpdump — wonderfully visual'},
        {url:'https://howdns.works', label:'howdns.works'},
        {url:'https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/', label:'TLS 1.3 explainer — Cloudflare'}
      ]))}
    `
  },

  // ── MODULE 3: CONTAINERS ────────────────────────────────────
  { id:'docker', icon:'🐳', title:'Containers & Docker',
    subtitle:'Image layers, build optimisation, runtime security',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','image vs container, Dockerfile instructions (FROM/RUN/COPY/EXPOSE/CMD/ENTRYPOINT), docker run flags, basic networking (bridge/host), volumes'],
        ['Intermediate','layer caching mechanics, multi-stage builds, CMD vs ENTRYPOINT (and how K8s command/args map), build cache invalidation, .dockerignore, image tagging strategy'],
        ['Advanced','distroless / scratch base images, OCI spec, image signing (cosign/Sigstore), SBOM generation, Trivy scanning in CI, build secrets (--secret mount), BuildKit features']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Explain CMD vs ENTRYPOINT — and how K8s command/args relate.',
          a:'ENTRYPOINT is the executable; CMD provides default arguments. When both are present, CMD args are appended to ENTRYPOINT. Shell form (CMD ["sh","-c","..."]) vs exec form (CMD ["nginx","-g","daemon off"]) — always prefer exec form so PID 1 is your process, not a shell (which won\'t forward signals). In K8s: <code>command</code> overrides ENTRYPOINT, <code>args</code> overrides CMD.' },
        { q:'How do multi-stage builds reduce image size?',
          a:'Compile/build in a fat "builder" stage (with SDK, compilers, test deps), then COPY only the final binary/artifact into a minimal runtime stage (distroless, Alpine, scratch). Each stage gets its own layer set. Only the final stage\'s layers ship in the pushed image. Typical: Go binary compiled in golang:1.22 → copied to gcr.io/distroless/static. Result: 400MB → 8MB. Also eliminates build toolchain from the attack surface.' },
        { q:'What is the OCI spec and why does it matter?',
          a:'The Open Container Initiative defines: (1) <strong>Image spec</strong> — how image layers and manifests are structured (enabling Docker, Podman, Buildah to be interoperable). (2) <strong>Runtime spec</strong> — what a low-level container runtime (runc, crun) must implement. (3) <strong>Distribution spec</strong> — how registries serve images. This standardisation means you can build with Buildah, sign with cosign, scan with Trivy, and run with containerd — all interchangeable.' },
        { q:'How do you scan images for vulnerabilities in CI?',
          a:'Run Trivy or Grype as a CI step right after build: <code>trivy image --exit-code 1 --severity HIGH,CRITICAL myimage:tag</code>. Exit-code 1 fails the pipeline on HIGH/CRITICAL. At the registry level, enable admission control (Kyverno policy) to reject pods running unsigned or unscanned images. For supply chain: generate SBOM (trivy --format cyclonedx), sign with cosign, and verify signature + SBOM at deploy time.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('3.1 — Multi-stage build', _code('dockerfile',
`FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download          # cached separately from source
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static:nonroot
COPY --from=builder /app/server /server
USER nonroot
ENTRYPOINT ["/server"]`))}
        ${_ex('3.2 — Trivy scan', _code('bash',
`trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
trivy image --format cyclonedx --output sbom.json myapp:latest`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://docs.docker.com/build/building/best-practices/', label:'Docker best practices for Dockerfiles'},
        {url:'https://aquasecurity.github.io/trivy', label:'Trivy — image scanning'},
        {url:'https://labs.play-with-docker.com', label:'Play with Docker', note:'free in-browser lab'}
      ]))}
    `
  },

  // ── MODULE 4: KUBERNETES ────────────────────────────────────
  { id:'k8s', icon:'☸️', title:'Kubernetes',
    subtitle:'The heart of the interview — architecture, networking, autoscaling, troubleshooting',
    content: ()=>`
      ${_note('This is your highest-priority module. Spend ~30% of prep time here. If you know one thing deeply, make it K8s.')}
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','control plane components (API server, etcd, scheduler, controller-manager), node components (kubelet, kube-proxy, container runtime), Pod lifecycle, Deployments/Services/ConfigMaps/Secrets'],
        ['Intermediate','ReplicaSet reconciliation loop, service types (ClusterIP/NodePort/LoadBalancer/ExternalName), Ingress + IngressController, HPA/VPA/KEDA, PVC/StorageClass, RBAC (Role/ClusterRole/Binding), health probes (liveness/readiness/startup)'],
        ['Advanced','scheduler internals (predicates/priorities), kube-proxy iptables vs ipvs vs eBPF, CNI deep dive, admission webhooks (mutating/validating), CRDs + operators (reconciliation pattern), etcd raft consensus, Pod QoS classes, PodDisruptionBudgets']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Walk me through what happens when you run kubectl apply -f deployment.yaml.',
          a:`kubectl serialises the manifest and sends an HTTP PATCH/POST to the API server. The API server authenticates (token/cert), authorises (RBAC check), and runs admission webhooks (mutating then validating). The object is written to etcd. The Deployment controller's watch fires; it creates/updates a ReplicaSet. The ReplicaSet controller ensures the right number of Pods exist. The scheduler picks nodes for Pending pods (filtering: PodFitsResources/Taints, scoring: LeastRequestedPriority etc.). kubelet on the node pulls the image, calls the CRI to create the container, starts it, and begins running health probes.` },
        { q:'A pod is stuck in CrashLoopBackOff. Walk through your debugging.',
          a:'1) <code>kubectl describe pod &lt;name&gt;</code> — look at Events section (image pull error? probe failure? OOMKilled?). 2) <code>kubectl logs &lt;pod&gt; --previous</code> — get last run logs. 3) Exit code matters: 137 = OOMKilled, 1 = app error, 2 = misuse of shell builtin. 4) If no logs, exec into init container or use ephemeral debug container. 5) Check resource requests vs node allocatable (<code>kubectl describe node</code>). 6) Check liveness probe settings — if it fires before app is ready, that causes a loop (add startup probe). Common root causes: misconfigured env vars/secrets, missing ConfigMap, OOM, bad health probe path.' },
        { q:'Explain Horizontal Pod Autoscaler — how it works and its limits.',
          a:'HPA watches metrics (CPU/memory via metrics-server, or custom via Prometheus adapter/KEDA) and adjusts Deployment replica count. Control loop: every 15s, fetch current metric, compute desired replicas = currentReplicas × (currentMetricValue / targetMetricValue), clamp between min/max, apply. Limits: scale-down is intentionally slow (5-min stabilisation window by default) to prevent thrash. Metrics-server only provides CPU/memory; for queue depth, RPS, or event-driven scaling you need KEDA. VPA adjusts requests/limits (can\'t run simultaneously with HPA on CPU/memory without coordination).' },
        { q:'What is a Pod Disruption Budget and when do you need one?',
          a:'A PDB defines minAvailable or maxUnavailable pods during voluntary disruptions (node drain, rolling update). Without a PDB, a node drain can evict all replicas of a Deployment simultaneously. With <code>minAvailable: 1</code>, the drain will block until at least one pod is healthy elsewhere before evicting the next. Essential for stateful services, single-replica critical apps, and anything with an SLA. Involuntary disruptions (node crash) bypass PDBs — for those you need redundancy + topology spread.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('4.1 — Troubleshooting drill', _code('bash',
`# Common debug sequence
kubectl get pods -n my-ns -o wide
kubectl describe pod <pod-name> -n my-ns    # check Events
kubectl logs <pod-name> -n my-ns --previous  # last run logs
kubectl exec -it <pod-name> -- /bin/sh       # interactive debug
kubectl top pods -n my-ns                    # resource usage`))}
        ${_ex('4.2 — RBAC least-privilege', _code('yaml',
`kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata: { namespace: team-a, name: deployer }
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get","list","create","update","patch"]
---
kind: RoleBinding
...subjects: [{kind: Group, name: "team-a-devs"}]
---
# Test it
kubectl auth can-i delete deployments --as=jane -n team-a`))}
        ${_ex('4.3 — HPA manifest', _code('yaml',
`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: my-app }
spec:
  scaleTargetRef: { kind: Deployment, name: my-app }
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://kubernetes.io/docs/home/', label:'Kubernetes official docs'},
        {star:true, url:'https://github.com/kelseyhightower/kubernetes-the-hard-way', label:'Kubernetes the Hard Way'},
        {url:'https://killercoda.com', label:'Killercoda K8s scenarios', note:'free browser-based labs'},
        {url:'https://labs.play-with-k8s.com', label:'Play with Kubernetes'}
      ]))}
    `
  },

  // ── MODULE 5: OPENSHIFT ─────────────────────────────────────
  { id:'ocp', icon:'🔴', title:'OpenShift',
    subtitle:'Your specialisation — SCC, RBAC, operators, multi-tenancy',
    content: ()=>`
      ${_note('This is your strongest area. In interviews: lead with specificity — "in OpenShift" rather than generic K8s answers whenever possible.')}
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','oc vs kubectl differences, Projects (namespaces), ImageStreams, BuildConfigs, DeploymentConfigs vs Deployments, Routes vs Ingress'],
        ['Intermediate','Security Context Constraints (SCC) — the OpenShift-specific security layer above Pod Security Standards, RBAC in OpenShift (groups, identity providers), OperatorHub + OLM (Operator Lifecycle Manager), quotas + LimitRanges in multi-tenant clusters'],
        ['Advanced','Custom SCCs design, OAuth/IdP integration, OpenShift Pipelines (Tekton), OpenShift GitOps (ArgoCD), MachineConfigOperator, etcd encryption at rest, multi-cluster fleet management (ACM)']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'What is an SCC and how does it differ from Pod Security Standards?',
          a:'SCC (Security Context Constraint) is OpenShift\'s admission mechanism that controls what a pod can do — similar to K8s Pod Security Standards (PSS) but more granular and predates PSS. Key SCCs: <code>restricted-v2</code> (no root, no privilege escalation — default), <code>anyuid</code> (allows running as any UID, e.g., for legacy apps), <code>privileged</code> (full access — only for system components). You grant SCC to a ServiceAccount: <code>oc adm policy add-scc-to-user anyuid -z my-sa -n my-ns</code>. PSS is a K8s-native equivalent introduced in 1.25, but OCP environments still primarily use SCC.' },
        { q:'How does OLM (Operator Lifecycle Manager) work?',
          a:'OLM manages the full lifecycle of Operators on cluster. Components: <strong>CatalogSource</strong> (registry of available operators), <strong>Subscription</strong> (which operator + channel + update policy — Automatic or Manual), <strong>InstallPlan</strong> (the actual CRDs and RBAC to deploy, requires approval in Manual mode), <strong>ClusterServiceVersion (CSV)</strong> (the operator\'s self-description: owned CRDs, permissions, deployment spec). OLM handles upgrades by watching the channel for new CSVs and creating InstallPlans. For platform engineers this means we manage operator upgrades through Subscriptions, not by touching operator pods directly.' },
        { q:'Describe how you would set up multi-tenancy in OpenShift.',
          a:'Namespaces-as-tenants: each team gets a Project with ResourceQuotas (CPU/memory/objects), LimitRanges (default requests/limits), and NetworkPolicies (default-deny, allow only within-project + ingress from router). RBAC: team gets admin Role within their Project, no cross-project access. SCC: restricted-v2 by default — teams request SCC escalation via change process. For stronger isolation, MachineConfigPools can pin workloads to dedicated nodes via Taints/Tolerations. The key principle: teams can\'t break each other\'s quota or security posture.' },
        { q:'What is ImageStream and why does OpenShift use it?',
          a:'An ImageStream is an abstraction over a container image that tracks image metadata and changes without storing the image bytes in OpenShift. It provides a stable reference (imagestream:tag) that can be updated when the underlying image changes — triggering BuildConfigs or DeploymentConfigs to rebuild/redeploy automatically via image change triggers. Benefits: decouple from registry-specific URLs, enable automatic redeployment on base image updates (security patches), and provide a clear history of what was deployed.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('5.1 — SCC troubleshooting', _code('bash',
`# Find which SCC a pod is using
oc get pod <pod-name> -o jsonpath='{.metadata.annotations.openshift\.io/scc}'
# Grant SCC to a service account
oc adm policy add-scc-to-user anyuid -z my-sa -n my-namespace
# Check what SCCs a user can use
oc adm policy who-can use scc restricted-v2`))}
        ${_ex('5.2 — Operator subscription', _code('yaml',
`apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata: { name: my-operator, namespace: my-ns }
spec:
  channel: stable
  name: my-operator
  source: redhat-operators
  sourceNamespace: openshift-marketplace
  installPlanApproval: Automatic`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://docs.openshift.com', label:'OpenShift official docs'},
        {star:true, url:'https://www.redhat.com/en/services/training/red-hat-openshift-administration-ii-configuring-a-production-cluster', label:'Red Hat DO280 — preps EX280 exam'},
        {url:'https://developers.redhat.com/developer-sandbox', label:'Red Hat Developer Sandbox', note:'free OpenShift cluster'}
      ]))}
    `
  },

  // ── MODULE 6: CI/CD & GITOPS ────────────────────────────────
  { id:'cicd', icon:'🔄', title:'CI/CD & GitOps',
    subtitle:'Your biggest gap — ArgoCD, GitOps loop, progressive delivery',
    content: ()=>`
      ${_note('★ <strong>Most important module after K8s.</strong> GitOps/ArgoCD is your stated weakest area and the most common interview topic at senior level. Invest 20% of your prep here.')}
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','CI (lint/test/build/scan on every commit) vs CD (automated delivery), difference between push-based and pull-based CD, ArgoCD architecture (Application CRD, reconciliation loop)'],
        ['Intermediate','GitOps principles (Git as single source of truth, declarative, automated drift detection + correction), ArgoCD sync policies + waves + hooks, Argo Rollouts (canary + blue-green strategies), multi-env promotion patterns (Kustomize overlays or Helm values)'],
        ['Advanced','App-of-apps pattern, ApplicationSets for fleet management, image updater automation, DORA metrics (deployment frequency, lead time, MTTR, change failure rate), feature flags + progressive delivery, GitOps with multiple clusters']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Explain GitOps — what is the pull-based model and why is it better?',
          a:`GitOps = Git is the single source of truth for desired cluster state. The cluster pulls from Git (ArgoCD/Flux running in-cluster polls Git), compares desired vs actual, and self-heals. Contrast with push-based CI/CD: a pipeline with cluster credentials pushes changes (kubectl apply) from outside. Pull-based advantages: no long-lived credentials outside the cluster, cluster can self-heal drift at any time, Git provides a natural audit trail + rollback (git revert), works behind firewalls (cluster pulls out, nothing pushes in). The single source of truth means "what\'s in Git is what\'s running" — a constraint that improves reliability and auditability.` },
        { q:'Walk through an ArgoCD application sync flow.',
          a:'An Application CRD defines: source (Git repo + path + revision) and destination (cluster + namespace). ArgoCD\'s repo-server clones and templates the manifests (Helm/Kustomize/raw YAML). The sync engine compares desired state vs live cluster state (via resource diffs). If OutOfSync and auto-sync is on, it applies the diff. Sync hooks (PreSync, Sync, PostSync, SyncFail) allow database migrations, smoke tests, or notifications at each stage. Sync waves order resources (wave -1 for CRDs, wave 0 for namespaces, wave 1+ for app resources).' },
        { q:'How do Argo Rollouts enable a canary deployment?',
          a:'Argo Rollouts replaces the standard Deployment controller with a Rollout resource. On a new canary: shift 10% of traffic to the new version (via weighted VirtualService in Istio or ingress annotation), pause, analyse (AnalysisTemplate checks error rate / latency in Prometheus), if healthy promote to 50%, analyse again, promote to 100%, and delete the old ReplicaSet. On failure: automatic rollback to 0% canary. The key power is automated analysis — the rollout gating is metric-driven, not manual.' },
        { q:'What are DORA metrics and why do they matter for senior interviews?',
          a:'DORA (DevOps Research and Assessment) four key metrics: (1) <strong>Deployment Frequency</strong> — how often you deploy to prod (elite = multiple/day). (2) <strong>Lead Time for Changes</strong> — time from commit to prod (elite = < 1h). (3) <strong>Change Failure Rate</strong> — % of changes causing incidents (elite = 0–15%). (4) <strong>MTTR</strong> — time to restore service (elite = < 1h). They matter because they correlate with org performance. In an interview: cite them to frame why GitOps + progressive delivery improves LT and CFR; cite MTTR when discussing incident management.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('6.1 — Deploy ArgoCD and sync an app', _code('bash',
`kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# Port-forward the UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Create an Application (CLI)
argocd app create my-app --repo https://github.com/me/repo --path k8s --dest-server https://kubernetes.default.svc --dest-namespace default --sync-policy automated`))}
        ${_ex('6.2 — Kustomize multi-env structure', _code('bash',
`# Recommended layout
k8s/
  base/          # shared manifests
    deployment.yaml
    service.yaml
    kustomization.yaml
  overlays/
    dev/          # dev-specific patches
      kustomization.yaml   # patches: replicas: 1, image tag: dev
    prod/
      kustomization.yaml   # patches: replicas: 5, resource limits, PDB`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://argo-cd.readthedocs.io', label:'Argo CD docs'},
        {star:true, url:'https://argo-rollouts.readthedocs.io', label:'Argo Rollouts', note:'canary + blue-green'},
        {url:'https://opengitops.dev', label:'OpenGitOps principles (CNCF)'},
        {url:'https://docs.github.com/actions', label:'GitHub Actions docs'}
      ]))}
    `
  },

  // ── MODULE 7: IAC ───────────────────────────────────────────
  { id:'iac', icon:'🏗️', title:'IaC — Terraform & Helm',
    subtitle:'State management, modules, drift, Helm chart design',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','Terraform: providers, resources, plan/apply/destroy cycle, variables, outputs, .tfstate file purpose; Helm: chart structure (Chart.yaml, templates/, values.yaml), install/upgrade/rollback'],
        ['Intermediate','Terraform: remote state (S3+DynamoDB lock), modules for DRY infra, data sources, lifecycle rules (prevent_destroy, create_before_destroy), import, workspace vs separate state files; Helm: values overrides, templating (range/if/with), named templates, library charts'],
        ['Advanced','Terraform: state locking races, drift detection strategy, sensitive outputs, provider version constraints, monorepo vs per-service state, Terragrunt for DRY configs; Helm: OCI registries, schema validation, hooks (pre-install/post-upgrade), dependency charts, Helmfile for multi-chart deployment']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'What is Terraform state and why must it be remote?',
          a:'State is Terraform\'s record of what real infrastructure exists and which resource config it maps to. Local state (.tfstate file) is fine for one developer but breaks in teams: concurrent applies corrupt state, the file can\'t be shared easily, and it may contain secrets in plaintext. Remote state (S3 + DynamoDB for AWS): S3 stores the file, DynamoDB provides a lock (only one apply at a time). Also enables state sharing between modules via <code>terraform_remote_state</code> data source. Bottom line: remote state = collaboration + safety + no secrets on laptops.' },
        { q:'How do you handle Terraform drift in production?',
          a:'Drift = real infra has been manually changed from what Terraform expects. Detection: run <code>terraform plan</code> in CI on a schedule (or on every PR) — any plan showing changes when there should be none is drift. Response: (1) if the manual change was intentional, update the Terraform code to match and re-apply. (2) If unintentional, apply Terraform to restore. Prevention: enforce "no manual changes" via IAM — only the CI/CD pipeline role can mutate infra, humans have read-only. This makes Terraform the single source of truth.' },
        { q:'Explain Helm\'s upgrade/rollback lifecycle.',
          a:'<code>helm upgrade myrelease ./chart --values prod-values.yaml --atomic</code>: Helm renders templates with merged values, calculates the diff against the current release, applies Kubernetes objects, waits for rollout (readiness probes). If <code>--atomic</code> is set and any resource fails to become ready within the timeout, Helm automatically runs <code>helm rollback</code> to the previous revision. Each release is versioned; <code>helm history</code> shows all revisions. Manual rollback: <code>helm rollback myrelease 3</code> (to revision 3). Hooks run at defined lifecycle points (pre-upgrade can run DB migrations, post-upgrade can run smoke tests).' },
        { q:'Terraform modules — when and how to structure them?',
          a:'Modules avoid copy-pasting resource configs across environments. Rule: create a module when you\'d otherwise duplicate the same resources with slight variations. Structure: <code>modules/eks-cluster/</code> with inputs (cluster_name, node_count, vpc_id), outputs (cluster_endpoint, oidc_arn), and resource definitions. Environments call the module with different variable values. Anti-pattern: one giant "everything" module — it becomes impossible to change one service without risking another. Monorepo layout: <code>modules/</code> (reusable), <code>envs/dev/</code>, <code>envs/prod/</code> each calling modules.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('7.1 — Remote state setup', _code('terraform',
`terraform {
  backend "s3" {
    bucket         = "my-tfstate-bucket"
    key            = "prod/eks/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "tf-lock"
    encrypt        = true
  }
}`))}
        ${_ex('7.2 — Helm values override pattern', _code('bash',
`helm upgrade --install my-app ./charts/my-app \
  -f charts/my-app/values.yaml \        # defaults
  -f envs/prod/values.yaml \            # env-specific overrides
  --set image.tag=${GIT_SHA} \          # CI injects image tag
  --namespace prod --atomic --timeout 5m`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://developer.hashicorp.com/terraform/tutorials', label:'Terraform tutorials (HashiCorp)'},
        {star:true, url:'https://helm.sh/docs/', label:'Helm docs'},
        {url:'https://developer.hashicorp.com/certifications/infrastructure-automation', label:'HashiCorp Terraform Associate cert', note:'low effort, high value'}
      ]))}
    `
  },

  // ── MODULE 8: AWS ───────────────────────────────────────────
  { id:'aws', icon:'☁️', title:'Cloud Platforms (AWS)',
    subtitle:'EKS, VPC, IAM, IRSA, Well-Architected',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','core services: VPC (subnets, route tables, IGW, NAT GW), EC2 (instance types, ASGs), IAM (users/roles/policies, least privilege), S3 (buckets, policies), RDS'],
        ['Intermediate','EKS (managed K8s: node groups, Fargate, cluster autoscaler), IRSA (IAM Roles for Service Accounts — pod-level AWS permissions without static keys), ALB Ingress Controller, ECR, CloudWatch + CloudTrail, VPC CNI plugin'],
        ['Advanced','EKS security: pod identity, private API endpoint, node IAM minimisation; multi-account structure (AWS Orgs + SCPs); Karpenter vs Cluster Autoscaler; Well-Architected 6 pillars; cost optimisation (Savings Plans, Spot, right-sizing)']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'How does IRSA work and why is it better than node IAM roles?',
          a:`IRSA (IAM Roles for Service Accounts): each Kubernetes ServiceAccount is annotated with an IAM Role ARN. The EKS OIDC provider issues a signed JWT for the pod\'s SA. The pod\'s AWS SDK exchanges this JWT for temporary credentials via AWS STS (AssumeRoleWithWebIdentity). The IAM Role trust policy only allows tokens from that specific SA in that namespace. Why better than node IAM roles: with node roles, every pod on the node inherits the role — compromise of one pod = full node-role access. IRSA gives per-pod, per-SA least-privilege AWS access. The creds rotate automatically (STS tokens are short-lived).` },
        { q:'Explain the 5 (now 6) Well-Architected Framework pillars.',
          a:'<strong>Operational Excellence</strong> — runbooks, CI/CD, small safe changes, observability. <strong>Security</strong> — least privilege, encryption at rest/transit, threat detection, incident response. <strong>Reliability</strong> — auto-scaling, multi-AZ, backup + restore, DR testing. <strong>Performance Efficiency</strong> — right instance types, caching, serverless where appropriate. <strong>Cost Optimisation</strong> — right-sizing, Reserved Instances/Savings Plans, Spot, unused resource cleanup. <strong>Sustainability</strong> (6th pillar added 2021) — minimise footprint, right-size, use managed services. Interviewers often ask you to apply these to a design problem.' },
        { q:'What is the difference between Cluster Autoscaler and Karpenter?',
          a:'Cluster Autoscaler (CA): watches for Pending pods (can\'t schedule due to insufficient resources), calls ASG to add nodes of a pre-defined type, waits for them to join. Karpenter: directly calls EC2 (no ASG needed), calculates the optimal instance type(s) for the pending pod requirements, and provisions them. Karpenter is faster (no ASG warm-up delay), more flexible (can consolidate idle nodes, pick the cheapest instance type that fits), and supports Spot interruption handling natively. CA is simpler and works with any cloud; Karpenter is AWS-native (GCP port exists) but significantly better performance at scale.' },
        { q:'Design a production VPC for an EKS cluster.',
          a:'Minimum: 3 AZs. <strong>Public subnets</strong> (one per AZ): ALBs, NAT Gateways, bastion hosts. Tagged for ALB Ingress Controller discovery. <strong>Private subnets</strong> (one per AZ): EKS worker nodes, RDS. Egress via NAT GW in the same AZ (cross-AZ NAT traffic is billed). EKS control plane API endpoint: private-only (or public + private with IP allowlist). Pod networking: VPC CNI assigns real VPC IPs to pods — size subnets for max pod count × nodes. Route tables: private subnets → NAT GW; public subnets → IGW. Security groups: nodes allow only from ALB + control plane; RDS allows only from node SG.' }
      ]))}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://aws.amazon.com/architecture/well-architected/', label:'AWS Well-Architected Framework'},
        {star:true, url:'https://skillbuilder.aws', label:'AWS Skill Builder', note:'free official training'},
        {url:'https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html', label:'IRSA docs — EKS'}
      ]))}
    `
  },

  // ── MODULE 9: OBSERVABILITY ─────────────────────────────────
  { id:'obs', icon:'📊', title:'Observability',
    subtitle:'Metrics, logs, traces — SLI/SLO/SLA, Prometheus, alerting',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','3 pillars (metrics/logs/traces), Prometheus data model (labels, time series), basic PromQL (rate, sum, by), Grafana dashboards, log aggregation (EFK/Loki)'],
        ['Intermediate','SLI (what you measure), SLO (target), SLA (contractual), error budgets (1 - SLO availability = allowed downtime), alerting on SLOs vs symptoms (use RED method: Rate/Errors/Duration), Prometheus scraping + relabelling, recording rules'],
        ['Advanced','multi-cluster federation, Thanos/Cortex for long-term storage, OpenTelemetry (OTLP traces), distributed tracing (Jaeger/Tempo), cardinality explosions (what kills Prometheus), alert fatigue reduction (inhibition, routing, silences), capacity planning from metrics']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'What is an SLO and how does an error budget work?',
          a:'SLI = the metric you\'re measuring (e.g., % of requests with latency < 500ms). SLO = the target (99.5% of requests < 500ms, measured monthly). Error budget = 1 - SLO = 0.5% of requests allowed to be slow. If you\'ve consumed 80%+ of the budget, slow down deployments (feature work pauses, only reliability fixes). If you\'re well within budget, deploy faster. Error budgets make reliability/velocity trade-offs objective rather than political. An SLA is the contractual version of an SLO, with financial penalties — always set SLAs looser than internal SLOs.' },
        { q:'Explain the RED method and when to use it vs USE.',
          a:'<strong>RED</strong> (Weave Works — Tom Wilkie): <strong>R</strong>ate (requests/s), <strong>E</strong>rrors (error rate), <strong>D</strong>uration (latency distribution). Use for <em>services/microservices</em> — a Prometheus rule for every service\'s traffic shape. <strong>USE</strong> (Brendan Gregg): <strong>U</strong>tilisation (% busy), <strong>S</strong>aturation (queue depth / backlog), <strong>E</strong>rrors. Use for <em>resources</em> — CPU, disks, network interfaces. Together they cover the alert space: RED catches user-facing degradation, USE catches infrastructure saturation before it becomes user-facing.' },
        { q:'Write a PromQL query to alert on high error rate.',
          a:`<code>rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01</code> — this gives error rate; alert if > 1%. For SLO-based alerting use multi-window burn rate: check if the error budget is being consumed at > 1x rate over 1h AND > 5x over 5m (fast-burn alert = page immediately). Avoid alerting on raw counts — alert on rates. Use <code>without(pod)</code> or <code>by(service)</code> to aggregate across pod replicas.` },
        { q:'How do you prevent Prometheus cardinality explosions?',
          a:'Cardinality = unique label combinations. Every unique combination creates a new time series. Explosions happen when high-cardinality values become labels: user_id, request_id, full URL paths. Safeguards: (1) never label on unbounded values. (2) Use relabelling rules to drop unwanted labels at scrape time. (3) Set <code>--storage.tsdb.max-block-duration</code> limits. (4) Monitor series count per job via <code>prometheus_tsdb_head_series</code>. (5) For high-cardinality data, use Loki (logs with labels) or exemplars (linking traces from metrics) rather than making everything a metric label.' }
      ]))}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://prometheus.io/docs/', label:'Prometheus docs + PromQL reference'},
        {star:true, url:'https://sre.google/workbook/alerting-on-slos/', label:'Google SRE Workbook — Alerting on SLOs', note:'free'},
        {url:'https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/', label:'The RED Method'}
      ]))}
    `
  },

  // ── MODULE 10: SRE ──────────────────────────────────────────
  { id:'sre', icon:'🛡️', title:'SRE',
    subtitle:'Error budgets, incident management, blameless postmortems, toil',
    content: ()=>`
      ${_note('This is a senior-level differentiator. Many candidates know K8s commands but can\'t discuss reliability engineering. Knowing SRE concepts moves you up the salary band.')}
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','SRE vs DevOps (SRE implements DevOps with engineering rigour), toil (manual repetitive work that should be automated), on-call basics, SLI/SLO/SLA definitions'],
        ['Intermediate','error budgets (and freeze policies), blameless postmortems (5-whys on systems not people), incident command structure (IC, comms lead, scribe), change failure rate, capacity planning'],
        ['Advanced','chaos engineering (GameDay, failure injection), reliability roadmaps, SLO-based prioritisation (burn rate alerts, multi-window), eliminating toil at scale, CUJ (Critical User Journey) SLO design, resilience patterns (bulkhead, circuit breaker, timeouts/retries/backoff)']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'What is toil and how do you eliminate it?',
          a:'Toil (Google SRE definition): work that is manual, repetitive, automatable, tactical (not strategic), O(n) with service scale, and adds no enduring value. Examples: manually restarting pods on OOM, manual approval steps in deployments, copy-pasting values across config files. Eliminate by: writing automation (runbooks → scripts → systems), applying SRE principle that teams should spend < 50% on toil. When toil > 50%, the team is in a death spiral (more toil → less time to fix → more toil). Track toil fraction per sprint. Your build-time 70% improvement is a perfect toil-elimination example.' },
        { q:'Walk through your incident response process.',
          a:'Detection: SLO burn rate alert fires (symptom-based, not cause-based — we page on user impact). Triage: incident commander (IC) declares severity (SEV1 = complete outage, SEV2 = degraded, SEV3 = minor). Comms: create incident channel, update status page within 5 min (users informed before they notice). Mitigation: rollback if recent deploy (MTTR is optimised by making rollback the first action, not root-cause analysis). Root cause: only after service is stable. Postmortem: blameless, 5-whys on the system, action items with owners and due dates. Close: action items tracked to completion.' },
        { q:'How do you design for resilience (circuit breaker, bulkhead)?',
          a:'<strong>Timeout</strong>: every external call has an explicit timeout — never block indefinitely. <strong>Retry with exponential backoff + jitter</strong>: retry transient failures but back off exponentially to avoid thundering herd; add jitter to de-synchronise retries. <strong>Circuit breaker</strong>: if a downstream service is failing, stop sending requests (open the circuit), return a fast fallback, and probe periodically to see if it\'s recovered. Prevents cascade failures. <strong>Bulkhead</strong>: isolate thread pools / connection pools per dependency — a slow downstream only exhausts its own pool, not the shared pool. In K8s: ResourceQuotas + PodDisruptionBudgets are architectural bulkheads.' },
        { q:'What is chaos engineering and when is it appropriate?',
          a:'Deliberately injecting failure into a system (pod kills, network latency, disk full, AZ outage) to verify that the system degrades gracefully and your alerts + runbooks work. The hypothesis-driven approach: "We believe the system maintains 99.9% availability even when node X fails." Run in staging always; in production only when you have confidence + a gameday plan. Tools: ChaosMesh, Litmus, Gremlin, or simple <code>kubectl delete pod --grace-period=0</code>. The insight: you discover your failure modes before users do, and you fix runbooks before a real incident. Not appropriate: production systems with no SLO headroom or no incident response plan.' }
      ]))}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://sre.google/sre-book/table-of-contents/', label:'Google SRE Book', note:'free online'},
        {star:true, url:'https://sre.google/workbook/table-of-contents/', label:'Google SRE Workbook', note:'practical companion'},
        {url:'https://principlesofchaos.org', label:'Principles of Chaos Engineering'}
      ]))}
    `
  },

  // ── MODULE 11: SECURITY ─────────────────────────────────────
  { id:'sec', icon:'🔒', title:'Security & Compliance',
    subtitle:'RBAC, NetworkPolicy, secrets, supply chain, zero-trust',
    content: ()=>`
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','authn vs authz, RBAC (Role/ClusterRole/Binding), least privilege, encryption at rest vs in transit, K8s Secrets (base64 ≠ encryption)'],
        ['Intermediate','K8s RBAC design (namespace-scoped roles, SA per workload), NetworkPolicy (default-deny, targeted allow), secrets management (Vault/ESO vs Sealed Secrets), image scanning in CI, Pod Security Standards (restricted/baseline/privileged)'],
        ['Advanced','zero-trust + mTLS (service mesh), supply-chain security (SBOM, cosign signing, Kyverno/OPA admission policy), etcd encryption at rest, audit logging, compliance frameworks (SOC2/PCI-DSS), SPIFFE/SPIRE workload identity']
      ]))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Design RBAC for a multi-tenant Kubernetes cluster.',
          a:'Tenant isolation by namespace. Each team gets a <strong>Role</strong> scoped to its namespace granting only needed verbs on needed resources (manage Deployments/Services, read-only on others). Bind via <strong>RoleBinding</strong> to the team\'s group from the identity provider, not individual users. Platform admins get a <strong>ClusterRole</strong> but even that is scoped — no blanket cluster-admin. Workloads use dedicated <strong>ServiceAccounts</strong> with minimal permissions, never the default SA. Enforce with <strong>NetworkPolicies</strong> (default-deny cross-namespace) and <strong>ResourceQuotas</strong> so one tenant can\'t starve others. Principle: least privilege and isolation by default.' },
        { q:'How do you secure the container supply chain?',
          a:'Shift-left and verify at every gate: (1) <strong>scan</strong> images for CVEs in CI, block HIGH/CRITICAL (Trivy/Grype). (2) Generate an <strong>SBOM</strong> (trivy --format cyclonedx). (3) <strong>Sign</strong> images (cosign/Sigstore). (4) Enforce at the cluster with <strong>admission control</strong> (Kyverno/OPA Gatekeeper) — reject unsigned images, images from untrusted registries, or pods running as root. (5) Use <strong>minimal base images</strong> (distroless) to shrink the attack surface. The chain ensures only known-good, verified artifacts reach production.' },
        { q:'Encryption at rest vs in transit — where in K8s?',
          a:'In transit = TLS/mTLS (service-to-service, ingress). At rest = disk/volume encryption and, critically, <strong>etcd encryption</strong> — K8s Secrets are stored in etcd as base64-encoded plaintext by default, not encrypted. Enabling encryption-at-rest for etcd (EncryptionConfiguration with AES-GCM or KMS provider) is essential. Plus encrypt PVs and use a real secrets store (Vault/ESO). Both layers required for PCI-DSS compliance.' },
        { q:'How do you handle secrets properly?',
          a:'Never in images, never in plaintext env vars in manifests, never in Git unencrypted. Use an external store (Vault, AWS Secrets Manager) with the <strong>External Secrets Operator</strong> or CSI secrets store driver — workloads fetch at runtime. Or use <strong>Sealed Secrets/SOPS</strong> if secrets must live in Git (encrypted at rest in Git). Mount as files over env vars (env leaks into logs/child processes). Scope per environment, rotate centrally and automatically, audit access. The cluster\'s etcd must be encrypted since native Secrets are only base64.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('11.1 — Default-deny NetworkPolicy', _code('yaml',
`kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: team-a }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
# Then add targeted allows:
---
kind: NetworkPolicy
metadata: { name: allow-frontend-to-backend }
spec:
  podSelector: { matchLabels: { app: backend } }
  ingress:
  - from:
    - podSelector: { matchLabels: { app: frontend } }
    ports: [{ port: 8080 }]`))}
        ${_ex('11.2 — Kyverno admission policy (reject root)', _code('yaml',
`apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-non-root }
spec:
  rules:
  - name: require-non-root
    match: { resources: { kinds: [Pod] } }
    validate:
      message: "Containers must run as non-root"
      pattern:
        spec:
          containers:
          - securityContext:
              runAsNonRoot: true`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://kubernetes.io/docs/concepts/security/', label:'K8s security concepts (RBAC, NetworkPolicy, Pod Security)'},
        {url:'https://kyverno.io', label:'Kyverno', note:'policy-as-code, easier than OPA'},
        {url:'https://external-secrets.io', label:'External Secrets Operator'}
      ]))}
    `
  },

  // ── MODULE 12: SYSTEM DESIGN ────────────────────────────────
  { id:'design', icon:'🏛️', title:'System Design',
    subtitle:'7-step framework — the round that decides senior level and salary',
    content: ()=>`
      ${_note('<strong>The two things candidates skip that cost them the offer: failure modes (step 5) and explicit tradeoffs (step 7).</strong> Always volunteer "here\'s what breaks and how I recover" and "I chose X over Y because…"')}
      ${_sec('7-STEP FRAMEWORK (use for every design question)', `
        <table class="gfl-table">
          <tr><th>Step</th><th>What to cover</th></tr>
          <tr><td>1. Requirements</td><td>Scale, SLA, constraints, budget — ASK THESE FIRST before drawing anything</td></tr>
          <tr><td>2. High-level arch</td><td>Boxes + data flow — whiteboard first, detail second</td></tr>
          <tr><td>3. Component deep-dive</td><td>Pick 2–3 critical pieces and go deep</td></tr>
          <tr><td>4. Scale</td><td>10× load: shard, cache, queue — how does it hold up?</td></tr>
          <tr><td>5. Failure modes ★</td><td>What breaks, blast radius, recovery — NEVER SKIP</td></tr>
          <tr><td>6. Observability + Security + Cost</td><td>How you\'d know it\'s unhealthy, secure it, price it</td></tr>
          <tr><td>7. Tradeoffs ★</td><td>Name what you chose against — "I chose X over Y because…, accepting…"</td></tr>
        </table>
      `)}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Design a CI/CD platform for 500 engineers.',
          a:'<strong>Requirements</strong>: ~10k builds/day, peak concurrency, build-time SLA, multi-language, secrets, audit.<br><strong>Architecture</strong>: Git → webhook → build queue (Kafka/SQS) → autoscaling ephemeral K8s runners → shared build cache → image registry → GitOps repo bump → ArgoCD → dev/staging/prod.<br><strong>Key decisions</strong>: ephemeral K8s runners (clean, scalable, cost zero at off-peak) + shared cache layer (biggest build-time lever).<br><strong>Failure modes</strong>: runner pool exhaustion (queue absorbs burst + autoscale), registry outage (HA registry + retries), bad deploy (canary + auto-rollback), secret leak (external store, scoped, audited).<br><strong>Tradeoffs</strong>: ephemeral runners (clean, scalable) vs static runners (warm caches, faster but idle cost) — chose ephemeral + dedicated cache to balance.' },
        { q:'Design a system for 500 developers to self-serve infrastructure safely.',
          a:'IDP (Internal Developer Platform) approach: developers request infra through a declarative interface (a Git repo of simple manifests or a Backstage portal), not raw cloud access. Behind it, <strong>golden-path templates</strong> (Terraform modules, Helm charts) encode org standards. <strong>Policy-as-code</strong> (OPA/Sentinel) validates before apply. <strong>GitOps</strong> provisions it. Speed (self-serve) with safety (guardrails) — devs can\'t misconfigure because the paved road only allows compliant choices. Failure isolation via per-team namespaces/accounts and quotas. Tradeoff: upfront platform investment vs long-term scaling; worth it past ~50 engineers.' },
        { q:'Walk me through more design prompt angles.',
          a:'<strong>Multi-region DR</strong>: RTO/RPO drive everything; active-active vs active-passive; data replication lag.<br><strong>Centralised logging for 1000 services</strong>: ingest pipeline, cardinality/cost, retention tiers, index vs object store.<br><strong>Self-healing K8s platform</strong>: reconciliation, health checks, autoscaling, GitOps drift correction.<br><strong>Monitoring/alerting system</strong>: SLO-based alerts, federation at scale, alert fatigue.<br><strong>Zero-downtime deploys for stateful services</strong>: expand-contract migrations, leader election, PDBs.' },
        { q:'How would you migrate a monolith to microservices on Kubernetes?',
          a:'Incrementally via the <strong>strangler-fig pattern</strong> — never big-bang. Containerise the monolith and run it on K8s first (lift-and-shift) for operational consistency. Then carve out one bounded context at a time into a service, routing that functionality to the new service via the ingress/API gateway while the monolith handles the rest. Each extraction is independently shippable and reversible. Add observability and contracts between services early. Risk: distributed-systems complexity — only split where there\'s a real scaling/team-autonomy reason.' }
      ]))}
      ${_sec('DRILL: 3 TIMED DESIGN EXERCISES', `
        ${_ex('Exercise — Method', '<p style="font-size:13px;line-height:1.7;">Pick 3 prompts from the table above. For each: 45 minutes, whiteboard/paper, force yourself through all 7 framework steps <strong>aloud</strong>, recording yourself. Then critique: did you ask requirements first? Did you cover failure modes and tradeoffs? This recording-and-critiquing loop is the fastest way to improve.</p>')}
      `)}
    `
  },

  // ── MODULE 13: SCRIPTING ────────────────────────────────────
  { id:'scripting', icon:'⌨️', title:'Scripting & Automation',
    subtitle:'Bash + Python — practical automation, not LeetCode',
    content: ()=>`
      ${_note('Platform roles rarely test LeetCode. They test <strong>practical automation</strong>: can you write a clean Bash script? Parse JSON with jq? Call a K8s API from Python? This is very learnable.')}
      ${_sec('FOCUS LADDER', _ladder([
        ['Basic','Bash: variables, loops, conditionals, pipes, exit codes; Python: file I/O, dicts/lists, requests library'],
        ['Intermediate','Bash: functions, args, error handling (set -euo pipefail), text processing (grep/awk/sed/jq); Python: argparse, error handling, calling APIs/subprocess'],
        ['Advanced','idempotent scripts, parsing structured data (jq/yq), small automation tools, interacting with K8s/cloud APIs']
      ]))}
      ${_sec('BASH ROBUSTNESS HEADER — always start scripts with this', _code('bash',
`#!/usr/bin/env bash
set -euo pipefail    # -e: exit on error  -u: error on undefined var  -o pipefail: pipe failures count
IFS=$'\\n\\t'         # safer word splitting`))}
      ${_sec('INTERVIEW Q&A', _qa([
        { q:'Write a script to clean up Kubernetes pods stuck in Error/Completed state.',
          a:`${_code('bash',
`#!/usr/bin/env bash
set -euo pipefail
kubectl get pods --all-namespaces \\
  --field-selector 'status.phase!=Running,status.phase!=Pending' \\
  -o jsonpath='{range .items[*]}{.metadata.namespace} {.metadata.name}{"\\n"}{end}' \\
| while read -r ns pod; do
    echo "Deleting $ns/$pod"
    kubectl delete pod "$pod" -n "$ns"
  done`)}
"I'd add a <code>--dry-run</code> flag and logging before wiring to a CronJob — this is destructive."` },
        { q:'Parse a JSON API response and extract failing items (Python).',
          a:_code('python',
`import requests, sys
resp = requests.get("https://api.example.com/builds", timeout=10)
resp.raise_for_status()
failed = [b["id"] for b in resp.json()["builds"] if b["status"] == "FAILED"]
print(f"{len(failed)} failed builds: {failed}")
sys.exit(1 if failed else 0)   # exit code drives pipeline gating`) },
        { q:'How do you make a script idempotent and why?',
          a:'Idempotent means running it repeatedly produces the same result without harmful side effects — essential for automation that may retry. Techniques: check-before-act (does the resource exist before creating?), use declarative tools (<code>kubectl apply</code> not <code>create</code>), guard with conditionals, use upserts. It matters because automation reruns on failure/retries, and a non-idempotent script can double-create resources or corrupt state on the second run.' },
        { q:'Explain set -euo pipefail.',
          a:'<code>-e</code>: exit immediately if any command returns non-zero. <code>-u</code>: treat unset variables as an error (catches typos like <code>$VARAIBLE</code>). <code>-o pipefail</code>: if any command in a pipeline fails, the whole pipeline returns non-zero (without this, <code>false | true</code> returns 0). Together they turn bash from "silently continues on errors" to "fail fast and loud" — essential for scripts running in CI/CD.' }
      ]))}
      ${_sec('HANDS-ON EXERCISES', `
        ${_ex('13.1 — jq / yq drills', _code('bash',
`kubectl get pods -o json | jq '.items[] | select(.status.phase!="Running") | .metadata.name'
kubectl get nodes -o json | jq '.items[] | {name: .metadata.name, cpu: .status.capacity.cpu}'
yq '.spec.replicas' deployment.yaml
yq -i '.spec.replicas = 3' deployment.yaml`))}
        ${_ex('13.2 — Bash health checker', _code('bash',
`#!/usr/bin/env bash
set -euo pipefail
for url in "$@"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || echo 000)
  [[ "$code" == "200" ]] && echo "OK   $url" || echo "FAIL $url ($code)"
done`))}
        ${_ex('13.3 — Python log analysis', _code('python',
`from collections import Counter
ips, total, errors = Counter(), 0, 0
with open("access.log") as f:
    for line in f:
        parts = line.split()
        ips[parts[0]] += 1; total += 1
        if parts[8].startswith("5"): errors += 1
print(ips.most_common(10))
print(f"5xx rate: {errors/total:.2%}")`))}
      `)}
      ${_sec('RESOURCES', _res([
        {star:true, url:'https://google.github.io/styleguide/shellguide.html', label:'Google Shell Style Guide'},
        {star:true, url:'https://automatetheboringstuff.com', label:'Automate the Boring Stuff with Python', note:'free'},
        {url:'https://www.shellcheck.net', label:'ShellCheck', note:'lint your bash, learn from it'},
        {url:'https://jqlang.github.io/jq/manual/', label:'jq manual'}
      ]))}
    `
  },

  // ── MODULE 14: MOCK PREP ────────────────────────────────────
  { id:'mock', icon:'🎭', title:'Mock Interview & Final Prep',
    subtitle:'Week 6 mocks, STAR stories, final checklist, questions to ask them',
    content: ()=>`
      ${_sec('WEEK 6 MOCK SCHEDULE', `
        <table class="gfl-table">
          <tr><th>Mock</th><th>Format</th><th>Focus</th></tr>
          <tr><td>Mock 1 — Technical</td><td>K8s deep + live troubleshooting</td><td>Module 4/5/6 questions; debug a pod live; draw architecture</td></tr>
          <tr><td>Mock 2 — System Design</td><td>45-min design prompt</td><td>Drive all 7 framework steps; failure modes + tradeoffs</td></tr>
          <tr><td>Mock 3 — Behavioral</td><td>STAR answers</td><td>Your 5 real wins with numbers</td></tr>
        </table>
        ${_note('Record every mock. Watching yourself is uncomfortable and the single best feedback loop.')}
      `)}
      ${_sec('YOUR BEHAVIORAL STORIES (STAR format — lock these in)', `
        <table class="gfl-table">
          <tr><th>Theme</th><th>Your story + metric</th></tr>
          <tr><td>Big technical win</td><td>5h → 1.5h build time (70% reduction) via profiling + parallelisation</td></tr>
          <tr><td>Innovation</td><td>RAG documentation tool cutting onboarding 3wk → 1wk</td></tr>
          <tr><td>Process / leadership</td><td>Power Automate flow, 63% turnaround improvement, as Scrum Master</td></tr>
          <tr><td>Cross-team influence</td><td>Code-signing standardisation across BUs, 40% fewer incidents</td></tr>
          <tr><td>Learning fast</td><td>Mastering OpenShift + RHCOA in months on Emirates NBD platform</td></tr>
          <tr><td>Reliability (build in Dubai)</td><td>Incident you handled / monitoring you added — prepare this one</td></tr>
        </table>
      `)}
      ${_sec('FINAL-WEEK CHECKLIST', `
        <div id="mockChecklist">
          ${['Can draw K8s architecture from memory in 2 minutes',
             'Can debug CrashLoopBackOff aloud without notes',
             'Can explain CI vs CD vs GitOps crisply',
             'Can run the 7-step system-design framework on any prompt',
             'Can define SLI/SLO/SLA + error budget instantly',
             'Have 6 STAR stories rehearsed with numbers',
             'Have 5 smart questions to ask each interviewer',
             'Tech setup tested: quiet room, water, paper for diagrams']
             .map((item, i) => `<div class="gcl-item" data-cli="${i}"><div class="gcl-box" data-clb="${i}"></div><span>${item}</span></div>`)
             .join('')}
        </div>
      `)}
      ${_sec('5 QUESTIONS TO ASK THEM (signals seniority)', `
        <ol style="font-size:13px;line-height:2;padding-left:20px;color:var(--text-secondary,var(--text-muted));">
          <li>"What does on-call look like, and how do you manage alert quality?"</li>
          <li>"How mature is your platform — are teams self-serving infra yet?"</li>
          <li>"What's the biggest reliability or scaling challenge the team faces now?"</li>
          <li>"How do you balance feature velocity against reliability work — do you use error budgets?"</li>
          <li>"What does growth from this role look like in 18 months?"</li>
        </ol>
      `)}
    `
  },

  // ── MODULE 15: CERT ROADMAP ─────────────────────────────────
  { id:'certs', icon:'🏅', title:'Certification Roadmap',
    subtitle:'Maximum signal per study-hour — prioritised for your situation',
    content: ()=>`
      ${_note('UPSC is primary; tech is the credible backup. Optimise for <strong>maximum signal per study-hour</strong>. Don\'t cert-collect — 4–5 well-chosen certs beat 10 badges.')}
      ${_sec('RECOMMENDED SEQUENCE', `
        <table class="gfl-table">
          <tr><th>Phase</th><th>Cert</th><th>Why / When</th></tr>
          <tr><td>Phase 1 — Dubai (by ~May 2027)</td><td>★ <strong>EX280</strong> — Red Hat Certified Specialist in OpenShift Admin</td><td>You\'re doing OpenShift daily; smallest detour, strongest differentiator. Hands-on exam.</td></tr>
          <tr><td>Phase 2 — low-effort MCQ adds</td><td><strong>CGOA</strong> + <strong>CAPA</strong> + <strong>Terraform Associate</strong></td><td>All MCQ, ~$250–$70 each, certify exactly what you study in M6/M7. 3 badges for little extra time.</td></tr>
          <tr><td>Phase 3 — if/when entering job market</td><td>★ <strong>CKA</strong> — Certified Kubernetes Administrator</td><td>Most recognised K8s cred globally. Hands-on, needs real prep — schedule near your job search.</td></tr>
          <tr><td>Phase 4 — optional depth</td><td><strong>PCA</strong> / <strong>CKS</strong> / <strong>AWS SAA</strong></td><td>PCA if observability-heavy teams; CKS for fintech/banking (needs CKA first); AWS SAA if AWS shops.</td></tr>
        </table>
      `)}
      ${_sec('CERT VALUE TABLE', `
        <table class="gcert-table">
          <tr><th>Cert</th><th>Effort</th><th>Cost (approx)</th><th>Verdict</th></tr>
          <tr><td>EX280 (OpenShift)</td><td>Medium — hands-on</td><td>~$500 / RH Learning Sub</td><td>★ Primary target — matches your job, rare, enterprise</td></tr>
          <tr><td>CKA</td><td>Med-High — hands-on</td><td>~$445 (often discounted)</td><td>★ Most recognised K8s cred globally</td></tr>
          <tr><td>CGOA (GitOps)</td><td>Low — MCQ</td><td>~$250</td><td>★ High ROI — fills your CD gap</td></tr>
          <tr><td>CAPA (ArgoCD)</td><td>Low — MCQ</td><td>~$250</td><td>★ High ROI — directly matches M6</td></tr>
          <tr><td>Terraform Associate</td><td>Low — MCQ</td><td>~$70</td><td>Cheapest high-recognition cert in industry</td></tr>
          <tr><td>PCA (Prometheus)</td><td>Low — MCQ</td><td>~$250</td><td>Good add for observability-heavy teams</td></tr>
          <tr><td>AWS SAA</td><td>Medium — MCQ</td><td>~$150</td><td>High if your targets are AWS shops</td></tr>
          <tr><td>CKS (Security)</td><td>High — hands-on, needs CKA</td><td>~$445</td><td>Stretch goal — fintech/banking</td></tr>
        </table>
        ${_note('CNCF exams include one free retake. Linux Foundation\'s "Mega May" runs ~50% off. Treat costs as ballpark. CKA/CKS: <a href="https://killer.sh" target="_blank" rel="noopener">killer.sh</a> simulator included free with exam registration — the best final-prep tool.')}
      `)}
      ${_sec('2026 FACTS TO KNOW', `
        <ul style="font-size:13px;line-height:2;color:var(--text-secondary,var(--text-muted));padding-left:18px;">
          <li><strong>CNCF grandfathering (Jan 1, 2026):</strong> KCNA + later CKA/CKAD → KCNA auto-updates to current. Early associate certs aren\'t wasted.</li>
          <li><strong>Kubestronaut</strong> = pass all 5 of KCNA + KCSA + CKA + CKAD + CKS. Not advisable while UPSC is primary.</li>
          <li><strong>Hands-on > MCQ:</strong> EX280, CKA, CKS carry more weight. Use cheap MCQ certs as supporting signal, not centrepiece.</li>
          <li><strong>Recert clock:</strong> CNCF certs ~2 years, Red Hat ~3 years. Don\'t earn CKA so early it expires before your job search.</li>
        </ul>
      `)}
      ${_sec('CERT OFFICIAL LINKS', _res([
        {star:true, url:'https://www.redhat.com/en/services/training/red-hat-certified-openshift-administrator-exam', label:'EX280 — Red Hat Certified Specialist in OpenShift Admin'},
        {star:true, url:'https://www.cncf.io/training/certification/cka/', label:'CKA — Certified Kubernetes Administrator'},
        {url:'https://www.cncf.io/training/certification/cgoa/', label:'CGOA — GitOps Associate'},
        {url:'https://www.cncf.io/training/certification/capa/', label:'CAPA — Argo CD Associate'},
        {url:'https://developer.hashicorp.com/certifications/infrastructure-automation', label:'HashiCorp Terraform Associate'},
        {url:'https://www.cncf.io/training/certification/pca/', label:'PCA — Prometheus Certified Associate'},
        {url:'https://aws.amazon.com/certification/certified-solutions-architect-associate/', label:'AWS Solutions Architect Associate'},
        {url:'https://www.cncf.io/training/kubestronaut/', label:'Kubestronaut program'}
      ]))}
    `
  },

  // ── APPENDIX: RESOURCES ─────────────────────────────────────
  { id:'refs', icon:'📚', title:'Resources & References',
    subtitle:'Curated, mostly-free resources mapped to each module',
    content: ()=>`
      ${_note('Official docs are the highest-signal source. Interactive labs (Killercoda, KodeKloud) > reading alone. A book only for your 1–2 deepest gaps.')}
      ${_sec('FREE INTERACTIVE LABS', `
        <table class="gfl-table">
          <tr><th>Platform</th><th>What</th><th>Link</th></tr>
          <tr><td>★ Killercoda</td><td>Browser scenarios: K8s, Linux, CKA/CKAD/CKS, Git</td><td><a href="https://killercoda.com" target="_blank" rel="noopener">killercoda.com</a></td></tr>
          <tr><td>★ KodeKloud</td><td>K8s, Docker, Linux, cloud playgrounds</td><td><a href="https://kodekloud.com/free-courses" target="_blank" rel="noopener">kodekloud.com/free-courses</a></td></tr>
          <tr><td>Play with K8s</td><td>Free temporary cluster</td><td><a href="https://labs.play-with-k8s.com" target="_blank" rel="noopener">labs.play-with-k8s.com</a></td></tr>
          <tr><td>Play with Docker</td><td>Free temporary Docker host</td><td><a href="https://labs.play-with-docker.com" target="_blank" rel="noopener">labs.play-with-docker.com</a></td></tr>
          <tr><td>RH Developer Sandbox</td><td>Free OpenShift cluster (no install)</td><td><a href="https://developers.redhat.com/developer-sandbox" target="_blank" rel="noopener">developers.redhat.com/developer-sandbox</a></td></tr>
          <tr><td>KillerSh</td><td>CKA/CKAD/CKS exam simulators (free with exam)</td><td><a href="https://killer.sh" target="_blank" rel="noopener">killer.sh</a></td></tr>
        </table>
      `)}
      ${_sec('BOOKS (priority order)', `
        <ol style="font-size:13px;line-height:2.2;color:var(--text-secondary,var(--text-muted));padding-left:18px;">
          <li><strong>Kubernetes in Action, 2nd ed.</strong> — Marko Lukša (your core K8s text)</li>
          <li><strong>Designing Data-Intensive Applications</strong> — Martin Kleppmann (system design / distributed systems)</li>
          <li><strong>Site Reliability Engineering</strong> — Google (<a href="https://sre.google/sre-book/table-of-contents/" target="_blank" rel="noopener">free online</a>)</li>
          <li><strong>Terraform: Up & Running</strong> — Yevgeniy Brikman (IaC)</li>
          <li><strong>The Phoenix Project</strong> — Gene Kim (DevOps culture, easy read)</li>
          <li><strong>Observability Engineering</strong> — O'Reilly</li>
        </ol>
      `)}
      ${_sec('YOUTUBE CHANNELS', `
        <ul style="font-size:13px;line-height:2.2;color:var(--text-secondary,var(--text-muted));padding-left:18px;">
          <li><strong>TechWorld with Nana</strong> — DevOps/K8s end-to-end (excellent for visual learners)</li>
          <li><strong>KodeKloud</strong> — DevOps tutorials</li>
          <li><strong>Hussein Nasser</strong> — backend/networking deep dives</li>
          <li><strong>ByteByteGo</strong> — system design visuals</li>
          <li><strong>Marcel Dempers (That DevOps Guy)</strong> — practical hands-on builds</li>
        </ul>
      `)}
      ${_sec('WEEK-BY-WEEK RESOURCE MAP', `
        <table class="gfl-table">
          <tr><th>Week</th><th>Primary resources</th></tr>
          <tr><td>1 — Foundations</td><td>Linux Journey, Julia Evans zines, Killercoda Linux</td></tr>
          <tr><td>2 — Docker + K8s core</td><td>Docker docs, Kubernetes docs (Concepts), KodeKloud K8s beginner, Play-with-K8s</td></tr>
          <tr><td>3 — K8s adv + OpenShift</td><td>K8s the Hard Way (skim), OpenShift docs, RH Developer Sandbox, DO280 outline</td></tr>
          <tr><td>4 — CI/CD + IaC + Cloud</td><td>Argo CD docs, GitHub Actions docs, Terraform tutorials, Helm docs, AWS Well-Architected</td></tr>
          <tr><td>5 — Obs + SRE + Security</td><td>Prometheus docs, Google SRE Book (selected chapters), K8s security docs, Kyverno</td></tr>
          <tr><td>6 — Synthesis</td><td>System Design Primer, DDIA (skim), killer.sh sim, mock interviews</td></tr>
        </table>
      `)}
      ${_sec('PER-MODULE PRIORITY LINKS', _res([
        {star:true, url:'https://kubernetes.io/docs/home/', label:'Kubernetes official docs (M4)'},
        {star:true, url:'https://argo-cd.readthedocs.io', label:'Argo CD docs (M6)'},
        {star:true, url:'https://docs.openshift.com', label:'OpenShift official docs (M5)'},
        {url:'https://sre.google/sre-book/table-of-contents/', label:'Google SRE Book (M10) — free'},
        {url:'https://prometheus.io/docs/', label:'Prometheus docs + PromQL (M9)'},
        {url:'https://developer.hashicorp.com/terraform/tutorials', label:'Terraform tutorials (M7)'},
        {url:'https://helm.sh/docs/', label:'Helm docs (M7)'},
        {url:'https://aws.amazon.com/architecture/well-architected/', label:'AWS Well-Architected (M8)'},
        {url:'https://github.com/donnemartin/system-design-primer', label:'System Design Primer (M12) — free GitHub'},
        {url:'https://linuxjourney.com', label:'Linux Journey (M1) — free'},
        {url:'https://wizardzines.com', label:'Julia Evans zines (M2) — networking visuals'},
        {url:'https://automatetheboringstuff.com', label:'Automate the Boring Stuff with Python (M13) — free'}
      ]))}
    `
  }
];

// ── Progress (localStorage, no sync needed) ────────────────
function _getProgress() {
  try { return JSON.parse(localStorage.getItem('skadi_guide_progress') || '{}'); } catch { return {}; }
}
function _saveProgress(p) {
  try { localStorage.setItem('skadi_guide_progress', JSON.stringify(p)); } catch {}
}

// ── Main class ─────────────────────────────────────────────
class DevOpsGuideModal {
  constructor() {
    this._cur = 'prep';
    this._modal = null;
    this._nav = null;
    this._content = null;
  }

  init() {
    this._modal = document.getElementById('devopsGuideModal');
    if (!this._modal) return;
    this._nav = this._modal.querySelector('#guideNav');
    this._content = this._modal.querySelector('#guideContent');

    document.getElementById('openGuideBtn')?.addEventListener('click', () => this.open());
    this._modal.querySelector('#guideCloseBtn')?.addEventListener('click', () => this.close());
    this._modal.addEventListener('click', e => { if (e.target === this._modal) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this._isOpen()) this.close(); });

    this._buildNav();
  }

  open(moduleId) {
    this._modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.showModule(moduleId || this._cur);
  }

  close() {
    this._modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  _isOpen() { return this._modal?.classList.contains('is-open'); }

  showModule(id) {
    this._cur = id;
    this._nav.querySelectorAll('.gn-item').forEach(el =>
      el.classList.toggle('active', el.dataset.id === id));
    const mod = GUIDE_MODULES.find(m => m.id === id);
    if (!mod) return;

    const prog = _getProgress();
    const studied = !!prog[id];

    this._content.innerHTML = `
      <div class="gm-wrap">
        <div class="gm-header">
          <span class="gm-icon">${mod.icon}</span>
          <div>
            <h2 class="gm-title">${mod.title}</h2>
            ${mod.subtitle ? `<p class="gm-sub">${mod.subtitle}</p>` : ''}
          </div>
          <button class="gm-studied-btn${studied ? ' done' : ''}" id="gmStudiedBtn">
            ${studied ? '✅ Studied' : '○ Mark Studied'}
          </button>
        </div>
        ${mod.content()}
      </div>
    `;
    this._content.scrollTop = 0;

    // Q&A toggles
    this._content.querySelectorAll('.gqa-q').forEach(q => {
      q.addEventListener('click', () => q.closest('.gqa-item').classList.toggle('open'));
    });

    // Checklist boxes (module 'mock')
    this._content.querySelectorAll('[data-clb]').forEach(box => {
      const key = `cli_${id}_${box.dataset.clb}`;
      if (prog[key]) box.classList.add('on');
      box.addEventListener('click', () => {
        box.classList.toggle('on');
        const p = _getProgress();
        p[key] = box.classList.contains('on');
        _saveProgress(p);
      });
    });

    // "Mark studied" button
    document.getElementById('gmStudiedBtn')?.addEventListener('click', e => {
      const p = _getProgress();
      const nowStudied = !p[id];
      p[id] = nowStudied;
      _saveProgress(p);
      e.target.textContent = nowStudied ? '✅ Studied' : '○ Mark Studied';
      e.target.classList.toggle('done', nowStudied);
      // update nav badge
      const badge = this._nav.querySelector(`[data-prog="${id}"]`);
      if (badge) badge.classList.toggle('on', nowStudied);
    });
  }

  _buildNav() {
    const prog = _getProgress();
    this._nav.innerHTML = GUIDE_MODULES.map(m => `
      <button class="gn-item" data-id="${m.id}">
        <span class="gn-icon">${m.icon}</span>
        <span class="gn-label">${m.title}</span>
        <span class="gn-check${prog[m.id] ? ' on' : ''}" data-prog="${m.id}">✓</span>
      </button>
    `).join('');
    this._nav.querySelectorAll('.gn-item').forEach(btn =>
      btn.addEventListener('click', () => this.showModule(btn.dataset.id)));
  }
}

window.DevOpsGuide = new DevOpsGuideModal();
