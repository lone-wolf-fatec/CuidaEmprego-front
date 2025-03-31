@Configuration
public class InitialDataConfig {
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostConstruct
    public void initUsers() {
        if (!usuarioRepository.existsByUsername("admin")) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setEmail("admin@empresa.com");
            admin.setNome("Administrador");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setAtivo(true);
            
            Set<String> roles = new HashSet<>();
            roles.add("ADMIN");
            admin.setRoles(roles);
            
            usuarioRepository.save(admin);
        }
    }
}
