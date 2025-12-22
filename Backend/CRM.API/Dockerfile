# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["CRM.API.csproj", "./"]
RUN dotnet restore "CRM.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "CRM.API.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "CRM.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CRM.API.dll"]
