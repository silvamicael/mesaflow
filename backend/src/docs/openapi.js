export const openapi = {
  "openapi": "3.0.3",
  "info": {
    "title": "MesaFlow API",
    "version": "0.1.0",
    "description": "Base local e autenticação. Bearer JWT com sessão revogável. Swagger não persiste a autorização ao recarregar."
  },
  "servers": [
    {
      "url": "/"
    }
  ],
  "tags": [
    {
      "name": "Autenticação"
    },
    {
      "name": "Administração"
    },
    {
      "name": "Infraestrutura"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "Usuario": {
        "type": "object",
        "required": [
          "id",
          "nome",
          "email",
          "telefone",
          "papel"
        ],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "nome": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          },
          "telefone": {
            "type": "string",
            "nullable": true
          },
          "papel": {
            "type": "string",
            "enum": [
              "cliente",
              "funcionario",
              "admin"
            ]
          }
        }
      },
      "Erro": {
        "type": "object",
        "properties": {
          "erro": {
            "type": "object",
            "properties": {
              "codigo": {
                "type": "string"
              },
              "mensagem": {
                "type": "string"
              },
              "detalhes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "campo": {
                      "type": "string"
                    },
                    "mensagem": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "Cadastro": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "nome",
          "email",
          "senha"
        ],
        "properties": {
          "nome": {
            "type": "string",
            "minLength": 2,
            "maxLength": 120
          },
          "email": {
            "type": "string",
            "format": "email",
            "maxLength": 254
          },
          "senha": {
            "type": "string",
            "format": "password",
            "minLength": 10,
            "maxLength": 72,
            "description": "Entre 10 caracteres e 72 bytes UTF-8. Sem caractere NUL. Não é removido espaço da senha."
          },
          "telefone": {
            "type": "string",
            "pattern": "^\\+?[0-9]{10,15}$"
          }
        }
      },
      "Login": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "email",
          "senha"
        ],
        "properties": {
          "email": {
            "type": "string",
            "format": "email"
          },
          "senha": {
            "type": "string",
            "format": "password",
            "minLength": 10,
            "maxLength": 72,
            "description": "Entre 10 caracteres e 72 bytes UTF-8. Sem caractere NUL. Não é removido espaço da senha."
          }
        }
      },
      "LoginResposta": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string"
          },
          "token_type": {
            "type": "string",
            "enum": [
              "Bearer"
            ]
          },
          "expires_in": {
            "type": "integer",
            "example": 3600
          },
          "usuario": {
            "$ref": "#/components/schemas/Usuario"
          }
        }
      }
    }
  },
  "paths": {
    "/api/auth/register": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Cadastrar cliente",
        "description": "Papel e ativo não são aceitos. Telefone opcional; omita quando não informado. E-mail normalizado. Não autentica automaticamente.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Cadastro"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Cliente criado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "usuario": {
                      "$ref": "#/components/schemas/Usuario"
                    }
                  }
                }
              }
            }
          },
          "409": {
            "description": "E-mail indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite de requisições atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Falha interna",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Entrar e criar sessão",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Login"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Sessão criada",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResposta"
                }
              }
            }
          },
          "401": {
            "description": "E-mail ou senha inválidos; mesma resposta para conta inativa",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite de requisições atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Falha interna",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      "get": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Consultar usuário da sessão atual",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Perfil público",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "usuario": {
                      "$ref": "#/components/schemas/Usuario"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Token inválido, ausente, expirado, sessão revogada ou conta inativa",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Falha interna",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/logout": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Revogar a sessão atual",
        "description": "Outras sessões permanecem válidas. Reutilizar esse token retorna 401.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "204": {
            "description": "Sessão revogada; resposta sem corpo"
          },
          "401": {
            "description": "Token inválido, ausente, expirado, sessão revogada ou conta inativa",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Falha interna",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/status": {
      "get": {
        "tags": [
          "Administração"
        ],
        "summary": "Verificar permissão administrativa",
        "description": "Rota de verificação de RBAC, sem gestão de usuários nesta entrega.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Administrador autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string"
                    },
                    "acesso": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "403": {
            "description": "Perfil sem permissão",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "401": {
            "description": "Token inválido, ausente, expirado, sessão revogada ou conta inativa",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Falha interna",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      "get": {
        "tags": [
          "Infraestrutura"
        ],
        "summary": "Verificar API e banco",
        "responses": {
          "200": {
            "description": "Banco conectado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string"
                    },
                    "database": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "503": {
            "description": "Banco indisponível",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "429": {
            "description": "Limite atingido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    }
  }
};
