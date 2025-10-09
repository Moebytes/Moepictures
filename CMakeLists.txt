cmake_minimum_required(VERSION 3.28)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

project(NodeFunctions)

add_compile_definitions(-DNAPI_VERSION=8)

file(GLOB SOURCE_FILES "structures/NodeFunctions.cpp")

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})
target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_23)

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()